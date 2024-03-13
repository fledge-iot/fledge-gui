import { Component, OnInit, ViewChild, EventEmitter, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { forkJoin, timer, of, Subscription } from 'rxjs';
import { concatMap, delayWhen, retryWhen, take, tap, map } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AlertService, ProgressBarService, RolesService, ServicesApiService, SchedulesService, ResponseHandler, PingService } from '../../../../services';
import { SharedService } from '../../../../services/shared.service';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { AdditionalServiceModalComponent } from './additional-service-modal/additional-service-modal.component';
import { AdditionalServicesContextMenuComponent } from './additional-services-context-menu/additional-services-context-menu.component';
import { AvailableServices, Schedule, Service } from '../../../../models';
import { AdditionalServicesUtils } from './additional-services-utils.service';

@Component({
  selector: "app-list-additional-services",
  templateUrl: "./list-additional-services.component.html",
  styleUrls: ["./list-additional-services.component.css"],
})
export class ListAdditionalServicesComponent implements OnInit, OnDestroy {
  expectedServices = [
    {
      "package": "fledge-service-notification",
      "process": "notification",
      "schedule_process": "notification_c",
      "type": "Notification",
      "name": "",
      "state": "",
      "added": false
    },
    {
      "package": "fledge-service-bucket",
      "process": "bucket",
      "schedule_process": "bucket_storage_c",
      "type": "BucketStorage",
      "name": "",
      "state": "",
      "added": false
    },
    {
      "package": "fledge-service-management",
      "process": "management",
      "schedule_process": "management",
      "type": "Management",
      "name": "",
      "state": "",
      "added": false
    },
    {
      "package": "fledge-service-dispatcher",
      "process": "dispatcher",
      "schedule_process": "dispatcher_c",
      "type": "Dispatcher",
      "name": "",
      "state": "",
      "added": false
    }
  ];

  installedServicePkgs = [];
  availableServicePkgs = [];

  servicesRegistry = [];
  servicesSchedules = [];

  showLoading = false;
  viewPortSubscription: Subscription;
  servicesInfoSubscription: Subscription;
  viewPort: any = '';
  pollingScheduleID: string;
  isManualRefresh = false;

  service;
  allServicesInfo;
  public reenableButton = new EventEmitter<boolean>(false);
  @ViewChild(AdditionalServiceModalComponent, { static: true }) serviceModal: AdditionalServiceModalComponent;
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
    private additionalServicesUtils: AdditionalServicesUtils,
  ) {}

  ngOnInit() {
    this.ping.pingIntervalChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((pingTime: number) => {
        if (pingTime === -1) {
          this.isManualRefresh = true;
        } else {
          this.isManualRefresh = false;
        }
      });
    this.viewPortSubscription = this.sharedService.viewport.subscribe(viewport => {
      this.viewPort = viewport;
    });

    if (this.isManualRefresh) {
      this.additionalServicesUtils.getAllServiceStatus();
    }

    // Update state of services according to the response of '/service' endpoint response 
    this.servicesInfoSubscription = this.sharedService.allServicesInfo.subscribe(servicesInfo => {
      if (servicesInfo) {
        this.allServicesInfo = servicesInfo;
        this.installedServicePkgs.forEach(function (p) {
          servicesInfo.forEach(function (s) {
            if (p.name === s.name) {
              p.state = s.status;
            } else if (p.type === s.type) {
              p.name = s.name;
              p.state = s.status;
              p.added = true;
            }
          });
        });
        this.availableServicePkgs.forEach(function (p) {
          servicesInfo.forEach(function (s) {
            if (p.type === s.type) {
              p.name = s.name;
              p.state = s.status;
              p.added = true;
            }
          });
        });
      }

    });
    this.showLoadingText();
    this.checkSchedulesAndServices();
  }

  refreshServices() {
    if (this.isManualRefresh) {
      this.additionalServicesUtils.getAllServiceStatus();
    }
    this.checkSchedulesAndServices();
  }

  public checkSchedulesAndServices() { 
    this.schedulesService.getSchedules().
      subscribe((data: Schedule) => {
        this.ngProgress.start();
        this.servicesSchedules = data['schedules'].filter((sch) => this.expectedServices.some(es => es.schedule_process == sch.processName));
        this.pollingScheduleID = data['schedules'].find(s => s.processName === 'manage')?.id;
        
        // If schedule of all services available then no need to make other API calls
        if (this.servicesSchedules?.length === this.expectedServices.length) {
          this.availableServicePkgs = [];
          let serviceTypes = [];
          this.expectedServices.forEach(function (s) {
            serviceTypes.push(s["process"]);
          });
          this.getInstalledServices(serviceTypes);
          this.hideLoadingText();
          this.ngProgress.done();         
        } else {
          this.getAllServices();
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

  public getAllServices() {
    this.servicesRegistry = this.allServicesInfo.filter((s) => this.expectedServices.some(es => es.type == s.type));
    const addedServices = this.servicesSchedules.filter(sch => this.servicesRegistry.some(({name}) => sch.name === name));      

    // If we get expected services in the response of /service API then no need to make other (/installed, /available) API calls
    if (addedServices.length === this.expectedServices.length) {
      this.availableServicePkgs = [];
      let serviceTypes = [];
      this.expectedServices.forEach(function (s) {
        serviceTypes.push(s["process"]);
      });
      this.getInstalledServices(serviceTypes);
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
          this.getInstalledServices(installed["services"]);
          this.getAvaiableServices(available["services"]);
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

  public getInstalledServices(services) {
    let svcs = services.filter(
      (s) => !["south", "north", "storage"].includes(s)
    );
    this.installedServicePkgs = this.expectedServices.filter(
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

  public getAvaiableServices(services) {
    let svcs = services;
    const availableServices = this.expectedServices.filter(
      (s) => svcs.includes(s.package)
    );
    this.availableServicePkgs = availableServices.sort((a, b) => a.type.localeCompare(b.type))
  }

  /**
    * Open Settings modal
    */
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
    this.serviceModal.toggleModal(true);
    this.setService(service);
    this.serviceModal.getServiceInfo(service, this.pollingScheduleID);
  }

  getData(handleEvent = true) {
    if (handleEvent) {
      this.checkSchedulesAndServices();
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
        this.closeServiceModal();   
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

  closeServiceModal() {
    const serviceModal = <HTMLDivElement>document.getElementById('additional-service-modal');
    if (serviceModal) {
      this.serviceModal.toggleModal(false);
    }
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
    const initialDelay = 1000;
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
    this.closeServiceModal();
    this.checkSchedulesAndServices();
  }

  setService(service) {
    this.service = service;
  }

  public ngOnDestroy(): void {
    this.viewPortSubscription.unsubscribe();
    this.servicesInfoSubscription.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
