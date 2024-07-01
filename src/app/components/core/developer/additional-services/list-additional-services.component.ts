import { Component, OnInit, EventEmitter, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { forkJoin, timer, of, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { concatMap, delayWhen, retryWhen, take, tap, map } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AlertService, ProgressBarService, RolesService, ServicesApiService, SchedulesService, ResponseHandler, PingService } from '../../../../services';
import { SharedService } from '../../../../services/shared.service';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { AdditionalServicesContextMenuComponent } from './additional-services-context-menu/additional-services-context-menu.component';
import { AvailableServices, Schedule } from '../../../../models';
import { AdditionalServicesUtils } from './additional-services-utils.service';

@Component({
  selector: "app-list-additional-services",
  templateUrl: "./list-additional-services.component.html",
  styleUrls: ["./list-additional-services.component.css"],
})
export class ListAdditionalServicesComponent implements OnInit, OnDestroy {
  installedServicePkgs = [];
  availableServicePkgs = [];

  servicesRegistry = [];
  servicesSchedules = [];

  showLoading = false;
  viewPortSubscription: Subscription;
  viewPort: any = '';
  pollingScheduleID: string;
  isManualRefresh = false;

  service;
  public timer: any = '';
  public reenableButton = new EventEmitter<boolean>(false);
  @ViewChildren(AdditionalServicesContextMenuComponent) contextMenus: QueryList<AdditionalServicesContextMenuComponent>;
  
  destroy$: Subject<boolean> = new Subject<boolean>();
  constructor(
    public sharedService: SharedService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    private dialogService: DialogService,
    public servicesApiService: ServicesApiService,
    public rolesService: RolesService,
    public schedulesService: SchedulesService,
    private response: ResponseHandler,
    private ping: PingService,
    private router: Router,
    private additionalServicesUtils: AdditionalServicesUtils
  ) {}

  ngOnInit() {
    this.ping.pingIntervalChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((pingTime: number) => {
        if (pingTime === -1) {
          this.isManualRefresh = true;
          this.stop();
        } else {
          this.isManualRefresh = false;
          this.start(pingTime);
        }
      });
    this.viewPortSubscription = this.sharedService.viewport.subscribe(viewport => {
      this.viewPort = viewport;
    });

    this.showLoadingText();
    this.getAllServiceStatus(false);
  }

  public start(pingInterval) {
    this.stop();
    this.timer = setInterval(function () {
      this.getAllServiceStatus(true);
    }.bind(this), pingInterval);
  }

  public stop() {
    clearInterval(this.timer);
  }

  public getAllServiceStatus(autoRefresh) {
    this.servicesApiService.getAllServices()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any) => {
          const servicesRecord = [];
          const servicesData = data.services;
          const notificationService = servicesData.filter((el => (el.type === 'Notification')));
          const managementService = servicesData.filter((el => (el.type === 'Management')));
          const dispatcherService = servicesData.filter((el => (el.type === 'Dispatcher')));
          const bucketStorageService = servicesData.filter((el => (el.type === 'BucketStorage')));
          if (notificationService.length) {
            servicesRecord.push(notificationService[0]);
          }
          if (managementService.length) {
            servicesRecord.push(managementService[0]);
          }
          if (dispatcherService.length) {
            servicesRecord.push(dispatcherService[0]);
          }
          if (bucketStorageService.length) {
            servicesRecord.push(bucketStorageService[0]);
          }
          this.servicesRegistry = servicesRecord;
          this.sharedService.allServicesInfo.next(servicesRecord);

          if (autoRefresh) {
            this.syncServicesStatus(servicesRecord, this.installedServicePkgs);
          } else {
            this.checkSchedulesAndServices();
          }        
        },
        (error) => {
          console.log('service down ', error);
        });
  }

  syncServicesStatus(servicesRecord, installedServicePkgs) {
    servicesRecord.forEach(function (s) {
      if (s.name && installedServicePkgs.length > 0) {
        const service = installedServicePkgs.find(svc => svc.name === s.name);
        service.state = s.status;
      }
    });
  }

  public checkSchedulesAndServices() {
    this.ngProgress.start();
    this.schedulesService.getSchedules().
      subscribe((data: Schedule) => {      
        this.servicesSchedules = data['schedules'].filter((sch) => this.additionalServicesUtils.expectedServices.some(es => es.schedule_process == sch.processName));
        this.pollingScheduleID = data['schedules'].find(s => s.processName === 'manage')?.id;
        
        // If schedule of all services available then no need to make other API calls
        if (this.servicesSchedules?.length === this.additionalServicesUtils.expectedServices.length) {
          this.availableServicePkgs = [];
          let serviceTypes = [];
          this.additionalServicesUtils.expectedServices.forEach(function (s) {
            serviceTypes.push(s["process"]);
          });
          this.installedAndAddedServices(serviceTypes);
          this.hideLoadingText();
          this.ngProgress.done();         
        } else {
          // If schedule of all services are not available then check expected external services in /service API
          this.checkServices();
        }
      },
        (error) => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public checkServices() {
    const addedServices = this.servicesSchedules.filter(sch => this.servicesRegistry.some(({name}) => sch.name === name));
    
    // If we get expected services in the response of /service API then no need to make other (/installed, /available) API calls
    if (addedServices.length === this.additionalServicesUtils.expectedServices.length) {
      this.availableServicePkgs = [];
      let serviceTypes = [];
      this.additionalServicesUtils.expectedServices.forEach(function (s) {
        serviceTypes.push(s["process"]);
      });
      this.installedAndAddedServices(serviceTypes);
      this.hideLoadingText();
      this.ngProgress.done();
    } else {
      this.showServices();
    }
  }

  showServices() {
    let callsStack = {
      installed: this.servicesApiService.getInstalledServices(),
      available: this.servicesApiService.getAvailableServices()
    }
    this.ngProgress.start();
    forkJoin(callsStack)
      .pipe(
        map((response: any) => {
          const installed = <Array<string[]>>response.installed;
          const available = <Array<AvailableServices>>response.available;
          const result: any[] = [];
          result.push({
            ...{ 'installed': installed },
            ...{ 'available': available }
          });
          this.installedAndAddedServices(installed["services"]);
          this.getAvailableServices(available["services"]);
          this.hideLoadingText();
          return result;
        })
      )
      .subscribe((result) => {
        result.forEach((r: any) => {
          this.ngProgress.done();
          this.hideLoadingText();
          if (r.failed) {
            if (r.error.status === 0) {
              console.log('service down ', r.error);
            } else {
              this.alertService.error(r.error.statusText);
            }
          } else {
            this.response.handleResponseMessage(r.type);
          }
        });
      });
  }

  public installedAndAddedServices(services) {
    let svcs = services.filter(
      (s) => !["south", "north", "storage"].includes(s)
    );
    this.installedServicePkgs = this.additionalServicesUtils.expectedServices.filter(
      (s) => svcs.includes(s.process)
    );
    let replacement;
    let atIndex = -1;
    this.installedServicePkgs.forEach((installed, idx) => {
      replacement = structuredClone(installed);
      let foundService = this.servicesRegistry.find(s => s.type == installed.type);
      if (foundService === undefined) {
        let foundSchedule = this.servicesSchedules.find(s => s.processName == installed["schedule_process"]);
        if (foundSchedule !== undefined) {
          replacement.name = foundSchedule.name;
          replacement.added = true;
          replacement.state = foundSchedule.enabled === true ? 'running' : 'disabled';
          atIndex = idx;
        } else {
          replacement.name = '';
          replacement.added = false;
          replacement.state = 'installed';
          atIndex = idx;
        }
      } else {
        replacement.name = foundService.name;
        replacement.added = true;
        replacement.state = foundService.status;
        replacement.enabled = foundService.enabled;
        atIndex = idx;
      }
      if (atIndex != -1) {
        this.installedServicePkgs[atIndex] = replacement;
      }
    });
    const addedServices = this.installedServicePkgs.filter((s) => s.added === true);
    const servicesToAdd = this.installedServicePkgs.filter((s) => s.added === false);
    this.installedServicePkgs = addedServices.sort((a, b) => a.type.localeCompare(b.type)).concat(servicesToAdd.sort((a, b) => a.type.localeCompare(b.type)));
  }

  public getAvailableServices(services) {
    let svcs = services;
    const availableServices = this.additionalServicesUtils.expectedServices.filter(
      (s) => svcs.includes(s.package)
    );
    this.availableServicePkgs = availableServices.sort((a, b) => a.type.localeCompare(b.type))
  }

  openServiceModal(service) {
    if (!service) {
      this.alertService.warning('No package available to install');
      return;
    }
    let availableService = this.availableServicePkgs.find(s => s.process === service.process);
    if (availableService) {
      service.isInstalled = false;
    } else {
      service.isInstalled = true;
    }
    service.isEnabled = ["shutdown", "disabled", "installed", ""].includes(service.state) ? false : true;
    service['pollingScheduleID'] = this.pollingScheduleID;
    service['fromListPage'] = true;

    this.setService(service);
    this.router.navigate(['/developer/options/additional-services/config'], { state: { ...service }});
  }

  getData(handleEvent = true) {
    if (handleEvent) {
      this.getAllServiceStatus(false);
    }
  }

  deleteService(serviceName: string) {
    this.ngProgress.start();
    this.servicesApiService.deleteService(serviceName).subscribe(
      (data: any) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertService.success(data["result"], true);
        this.closeModal('delete-confirmation-dialog');
        this.getData();
      },
      (error) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        if (error.status === 0) {
            console.log("service down ", error);
        } else {
            this.alertService.error(error.statusText);
        }
      }
    );
  }

  applyClass(serviceStatus: string) {
    if (serviceStatus.toLowerCase() === "running") {
      return "is-success";
    }
    if (serviceStatus.toLowerCase() === "shutdown") {
      return "is-light";
    }
    if (serviceStatus.toLowerCase() === "unresponsive") {
      return "is-warning";
    }
    if (serviceStatus.toLowerCase() === "failed") {
      return "is-danger";
    }
    if (serviceStatus.toLowerCase() === "enabled" || serviceStatus.toLowerCase() === "installed") {
      return "is-info";
    }
  }

  public showLoadingText() {
    this.showLoading = true;
  }

  public hideLoadingText() {
    this.showLoading = false;
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  stateUpdate() {
    if (["shutdown", "disabled"].includes(this.service.state)) {
        this.additionalServicesUtils.enableService(this.service.name);
        // enabling service takes time to get the updated state from API
        this.getUpdatedState('running');
    } else {
      this.additionalServicesUtils.disableService(this.service.name);
      this.getUpdatedState('shutdown');  
    }
  }

  getUpdatedState(status) {
    let i = 1;
    const initialDelay = 1500;
    const expectedStatus = status;
    this.servicesApiService.getServiceByType(this.service.type)
      .pipe(
        take(1),
        // checking the response object for service.
        // if service.status !== 'running'/'shutdown' then
        // throw an error to re-fetch:
        tap((response: any) => {
          if (response['services'][0].status !== expectedStatus) {
            i++;
            throw response;
          }
        }),
        retryWhen(result =>
          result.pipe(
            // only if a server returned an error, stop trying and pass the error down
            tap(serviceStatus => {
              if (serviceStatus.error) {
                this.ngProgress.done();
                this.afterStateUpdate();
                throw serviceStatus.error;
              }
            }),
            delayWhen(() => {
              const delay = i * initialDelay;
              console.log(new Date().toLocaleString(), `retrying after ${delay} msec...`);             
              return timer(delay);
            }), // delay between api calls
            // Set the number of attempts.
            take(3),
            // Throw error after exceed number of attempts
            concatMap(o => {
              if (i > 3) {
                this.ngProgress.done();
                this.afterStateUpdate(); 
                return;
              }
              return of(o);
            }),
          ))
      ).subscribe(() => {
        this.ngProgress.done();
        this.afterStateUpdate();
      });
  }

  afterStateUpdate() {
    this.reenableButton.emit(false);
    this.closeModal('confirmation-dialog');
    this.getAllServiceStatus(false);
  }

  setService(service) {
    this.service = service;
  }

  public ngOnDestroy(): void {
    clearInterval(this.timer);
    this.viewPortSubscription.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
