import { Component, OnInit, Input, Output, ViewChild, EventEmitter, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { AlertService, ProgressBarService, RolesService, ServicesApiService, SchedulesService, ResponseHandler } from '../../../../services';
import { SharedService } from '../../../../services/shared.service';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { ManageServiceModalComponent } from './manage-service-modal/manage-service-modal.component';
import { ManageServicesContextMenuComponent } from './manage-services-context-menu/manage-services-context-menu.component';
import { AvailableServices, Schedule, Service } from '../../../../models';

@Component({
  selector: "app-list-manage-services",
  templateUrl: "./list-manage-services.component.html",
  styleUrls: ["./list-manage-services.component.css"],
})
export class ListManageServicesComponent implements OnInit, OnDestroy {
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
  @ViewChild(ManageServiceModalComponent, { static: true }) serviceModal: ManageServiceModalComponent;
  @ViewChildren(ManageServicesContextMenuComponent) contextMenus: QueryList<ManageServicesContextMenuComponent>;
  
  @Input() navigateFromParent: string;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    public sharedService: SharedService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    private dialogService: DialogService,
    public servicesApiService: ServicesApiService,
    public rolesService: RolesService,
    public schedulesService: SchedulesService,
    private response: ResponseHandler
  ) {}

  ngOnInit() {
    this.viewPortSubscription = this.sharedService.viewport.subscribe(viewport => {
      this.viewPort = viewport;
    });
    // Update state of services according to the response of '/service' endpoint response 
    this.servicesInfoSubscription = this.sharedService.allServicesInfo.subscribe(servicesInfo => {
      if (servicesInfo) {
        this.installedServicePkgs.forEach(function(p) {
          servicesInfo.forEach(function(s) {
            if (p.name === s.name) {
              p.state = s.status;
            } else if (p.type === s.type) {
              p.name = s.name;
              p.state = s.status;
              p.added = true;
            }
          });
        });
        this.availableServicePkgs.forEach(function(p) {
          servicesInfo.forEach(function(s) {
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
    if (!this.navigateFromParent) {
      this.showServices();
    }
  }

  showServices(from = null) {
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

          let installedServicePkgsNames = []
          this.installedServicePkgs.forEach(function(s) {
            installedServicePkgsNames.push(s["package"]);
          });

          // Remove service name from available list if it is already installed
          this.availableServicePkgs = this.availableServicePkgs.filter((s) => !installedServicePkgsNames.includes(s.package));
          this.hideLoadingText();
          if (from !== null) {
            let service = this.installedServicePkgs.find((s) => s.process === from);
            if (!service) {
              service = this.availableServicePkgs.find((s) => s.process === from);
            }
            this.openServiceModal(service);
          }
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
      if (foundService === undefined){
        let foundSchedule = this.servicesSchedules.find(s => s.processName == installed["schedule_process"]);
        if (foundSchedule !== undefined){
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
      if (atIndex != -1){
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
    this.serviceModal.toggleModal(true);
    this.setService(service);
    this.serviceModal.getServiceInfo(service, this.availableServicePkgs, this.pollingScheduleID);
  }

  getData() {
    // added 3 second wait after redirecting list page from modal beacuse it takes sometime to get data from API
    setTimeout(() => {
      this.showServices();
    }, 3000);
  }

  deleteService(serviceName, event = null) {
    this.ngProgress.start();
    this.servicesApiService.deleteService(serviceName).subscribe(
      (data: any) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertService.success(data["result"], true);
        this.closeModal("delete-confirmation-dialog");
        this.closeServiceModal();
        if (!this.navigateFromParent) {
          this.getData();
        }
        this.notify.emit(event);
      },
      (error) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.notify.emit(event);
        if (error.status === 0) {
          console.log("service down ", error);
        } else {
          this.alertService.error(error.statusText);
        }
      }
    );
  }

  enableService(serviceName, event = null) {
    this.ngProgress.start();
    this.schedulesService.enableScheduleByName(serviceName).subscribe(
      (data) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertService.success(data["message"], true);
        this.closeModal('confirmation-dialog');
        this.closeServiceModal();
        if (!this.navigateFromParent) {
          this.getData();
        }
        this.notify.emit(event);   
      },
      (error) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.notify.emit(event);
        if (error.status === 0) {
          console.log("service down ", error);
        } else {
          this.alertService.error(error.statusText);
        }
      }
    );
  }

  disableService(serviceName, event = null) {
    this.ngProgress.start();
    this.schedulesService.disableScheduleByName(serviceName).subscribe(
      (data) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertService.success(data["message"], true);
        this.closeModal('confirmation-dialog');
        this.closeServiceModal();
        if (!this.navigateFromParent) {
          this.getData();
        }
        this.notify.emit(event);
      },
      (error) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.notify.emit(event);
        if (error.status === 0) {
          console.log("service down ", error);
        } else {
          this.alertService.error(error.statusText);
        }
      }
    );
  }

  closeServiceModal() {
    const serviceModal = <HTMLDivElement>document.getElementById('manage-service-modal');
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

  onNotifyEvent(event) {
    if (event?.isCancelEvent) {
      this.notify.emit(event);
      return;
    }
    if (!event?.state && !this.navigateFromParent) {
      this.getData();
      return;
    }
    switch (event?.state) {
      case 'delete':
        this.deleteService(event.service, event);
        break;
      case 'disable':
        this.disableService(event.service, event);
        break;
      case 'enable':
        this.enableService(event.service, event);
        break;
      default:
        break;
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
        this.enableService(this.service.name);
    } else {
      this.disableService(this.service.name);
    }
  }

  setService(service) {
    this.service = service;
  }

  public ngOnDestroy(): void {
    this.viewPortSubscription.unsubscribe();
    this.servicesInfoSubscription.unsubscribe();
  }
}
