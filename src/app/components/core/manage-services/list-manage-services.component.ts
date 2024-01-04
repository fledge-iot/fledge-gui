import { Component, OnInit, ViewChild, EventEmitter, OnDestroy } from '@angular/core';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { AlertService, ProgressBarService, RolesService, ServicesApiService, SchedulesService, ResponseHandler } from '../../../services';
import { SharedService } from '../../../services/shared.service';
import { DialogService } from '../../common/confirmation-dialog/dialog.service';
import { ManageServiceModalComponent } from './manage-service-modal/manage-service-modal.component';

@Component({
  selector: "app-manage-services",
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
      "added": false    }
  ];

  installedServicePkgs = [];
  availableServicePkgs = [];

  // Chosen service to act upon from list 
  service: any;

  servicesRegistry = [];
  servicesSchedules = [];

  showLoading = false;
  viewPortSubscription: Subscription;
  viewPort: any = '';
  pollingScheduleID: string;

  public reenableButton = new EventEmitter<boolean>(false);
  @ViewChild(ManageServiceModalComponent, { static: true }) serviceModal: ManageServiceModalComponent;

  constructor(
    public sharedService: SharedService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    private dialogService: DialogService,
    public servicesApiService: ServicesApiService,
    public rolesService: RolesService,
    public schedulesService: SchedulesService,
    private response: ResponseHandler,
    private router: Router
  ) {}

  ngOnInit() {
    this.viewPortSubscription = this.sharedService.viewport.subscribe(viewport => {
      this.viewPort = viewport;
    });
    this.showLoadingText();
    this.showServices();
  }

  // sleep time expects milliseconds
  sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  showServices() {
    this.getServices();
    this.getSchedules();

    let callsStack = {
      installed: this.servicesApiService.getInstalledServices(),
      available: this.servicesApiService.getAvailableServices()
    }
    this.sleep(500).then(() => {
      forkJoin(callsStack)
        .pipe(
          map((response: any) => {
            const installed = <Array<any>>response.installed;
            const available = <Array<any>>response.available;
            const result: any[] = [];
            result.push({
              ...{ 'installed': installed },
              ...{ 'available': available }
            });
            this.getInstalledServices(installed["services"]);
            this.getAvaiableServices(available["services"]);

            let installedServicePkgsNames = []
            this.installedServicePkgs.forEach(function(s) {
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

  public getServices() {
    this.ngProgress.start();
    this.servicesApiService.getAllServices().subscribe(
      (res: any) => {
        this.ngProgress.done();

         // We don't care for services which are not in expectedServices
        var expectedTypes = []
        this.expectedServices.forEach(function(v) {
          expectedTypes.push(v["type"]);
        });

        this.servicesRegistry = res.services.filter((s) => expectedTypes.includes(s.type));
      },
      (error) => {
        /** request done */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log("service down ", error);
        } else {
          this.alertService.error(error.statusText);
        }
      }
    );
  }
  public getSchedules(): void {
    this.schedulesService.getSchedules().subscribe(
      (data: any) => {
        // We don't care for schedules which are not in expectedServices
        var expectedP = []
        this.expectedServices.forEach(function(v) {
          expectedP.push(v["schedule_process"]);
        });
        this.pollingScheduleID = data.schedules.find(s => s.processName === 'manage')?.id;
        this.servicesSchedules = data.schedules.filter((sch) => expectedP.includes(sch.processName));
      },
      (error) => {
        if (error.status === 0) {
          console.log("service down ", error);
        } else {
          this.alertService.error(error.statusText);
        }
      }
    );
  }

  /**
    * Open Settings modal
    */
   openServiceModal(service) {
    this.serviceModal.toggleModal(true);
    this.serviceModal.getServiceInfo(service, this.availableServicePkgs, this.pollingScheduleID);
  }

  onNotify() {
    // added 3 second wait after redirecting list page from modal beacuse it takes sometime to get data from API
    setTimeout(() => {
      this.showServices();
    }, 3000);
  }

  deleteService() {
    this.ngProgress.start();
    this.servicesApiService.deleteService(this.service.name).subscribe(
      (data: any) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertService.success(data["result"], true);
        this.closeModal("delete-confirmation-dialog");
        this.onNotify();
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

  enableService() {
    this.ngProgress.start();
    this.schedulesService.enableScheduleByName(this.service.name).subscribe(
      (data) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertService.success(data["message"], true);
        this.closeModal('confirmation-dialog');
        this.onNotify();
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

  disableService() {
    this.ngProgress.start();
    this.schedulesService.disableScheduleByName(this.service.name).subscribe(
      (data) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertService.success(data["message"], true);
        this.closeModal('confirmation-dialog');
        this.onNotify();
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

  setService(service) {
    this.service = service;
  }

  stateUpdate() {
    if (["shutdown", "disabled"].includes(this.service.state)) {
      this.enableService();
    } else {
      this.disableService();
    }
  }

  viewLogs(name: string) {
    this.router.navigate(['logs/syslog'], { queryParams: { source: name } });
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

  public ngOnDestroy(): void {
    this.viewPortSubscription.unsubscribe();
  }
}
