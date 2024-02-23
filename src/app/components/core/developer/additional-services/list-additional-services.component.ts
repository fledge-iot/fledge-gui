import { Component, OnInit, ViewChild, EventEmitter, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { forkJoin, timer, of, Subscription } from 'rxjs';
import { concatMap, delayWhen, retryWhen, take, tap, map } from 'rxjs/operators';

import { AlertService, ProgressBarService, RolesService, ServicesApiService, SchedulesService, ResponseHandler } from '../../../../services';
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

  service;
  public reenableButton = new EventEmitter<boolean>(false);
  @ViewChild(AdditionalServiceModalComponent, { static: true }) serviceModal: AdditionalServiceModalComponent;
  @ViewChildren(AdditionalServicesContextMenuComponent) contextMenus: QueryList<AdditionalServicesContextMenuComponent>;
  
  constructor(
    public sharedService: SharedService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    private dialogService: DialogService,
    public servicesApiService: ServicesApiService,
    public rolesService: RolesService,
    public schedulesService: SchedulesService,
    private response: ResponseHandler,
    private additionalServicesUtils: AdditionalServicesUtils,
  ) {}

  ngOnInit() {
    this.viewPortSubscription = this.sharedService.viewport.subscribe(viewport => {
      this.viewPort = viewport;
    });
    // Update state of services according to the response of '/service' endpoint response 
    this.servicesInfoSubscription = this.sharedService.allServicesInfo.subscribe(servicesInfo => {
      if (servicesInfo) {
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
    this.showServices();
  }

  showServices() {
    let callsStack = {
      services: this.servicesApiService.getAllServices(),
      schedules: this.schedulesService.getSchedules(),
      installed: this.servicesApiService.getInstalledServices(),
      available: this.servicesApiService.getAvailableServices()
    }
    forkJoin(callsStack)
      .pipe(
        map((response: any) => {
          const services = <Array<Service[]>>response.services;
          const schedules = <Array<Schedule[]>>response.schedules;
          const installed = <Array<string[]>>response.installed;
          const available = <Array<AvailableServices>>response.available;
          const result: any[] = [];
          result.push({
            ...{ 'services': services },
            ...{ 'schedules': schedules },
            ...{ 'installed': installed },
            ...{ 'available': available }
          });

          this.getServices(services["services"]);
          this.getSchedules(schedules["schedules"]);
          this.getInstalledServices(installed["services"]);
          this.getAvaiableServices(available["services"]);

          let installedServicePkgsNames = [];
          this.installedServicePkgs.forEach(function (s) {
            installedServicePkgsNames.push(s["package"]);
          });

          // Remove service name from available list if it is already installed
          this.availableServicePkgs = this.availableServicePkgs.filter((s) => !installedServicePkgsNames.includes(s.package));
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
          replacement.state = foundSchedule.enabled === true ? 'enabled' : 'disabled';
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

  public getServices(services) {
    // We don't care for services which are not in expectedServices
    this.servicesRegistry = services.filter((s) => this.expectedServices.some(es => es.type == s.type));
  }

  public getSchedules(schedules): void {
    // We don't care for schedules which are not in expectedServices
    this.servicesSchedules = schedules.filter((sch) => this.expectedServices.some(es => es.schedule_process == sch.processName));
    this.pollingScheduleID = schedules.find(s => s.processName === 'manage')?.id;
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

  getData() {
    // added 3 second wait after redirecting list page from modal beacuse it takes sometime to get data from API
    setTimeout(() => {
      this.showServices();
    }, 3000);
  }

  deleteService(serviceName) {
    this.additionalServicesUtils.deleteService(serviceName);
    this.reenableButton.emit(false);
    this.closeModal('delete-confirmation-dialog');
    this.closeServiceModal();
    this.getData();
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
        this.getUpdatedSate();
    } else {
      this.additionalServicesUtils.disableService(this.service.name);
      this.afterStateUpdate();  
    }
  }

  getUpdatedSate() {
    let i = 1;
    const initialDelay = 1000;
    this.servicesApiService.getServiceByType(this.service.type)
      .pipe(
        take(1),
        // checking the response object for service.
        // if pacakge.status !== 'running' then
        // throw an error to re-fetch:
        tap((response: any) => {
          if (response['services'][0].status !== 'running') {
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
    this.getData();
  }

  setService(service) {
    this.service = service;
  }

  public ngOnDestroy(): void {
    this.viewPortSubscription.unsubscribe();
    this.servicesInfoSubscription.unsubscribe();
  }
}
