import { Component, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { orderBy } from 'lodash';

import { AlertService, ProgressBarService, RolesService, ServicesApiService, SchedulesService } from '../../../services';
import { SharedService } from '../../../services/shared.service';
import { DialogService } from '../../common/confirmation-dialog/dialog.service';
import { ManageServiceModalComponent } from './manage-service-modal/manage-service-modal.component';

@Component({
  selector: "app-manage-services",
  templateUrl: "./list-manage-services.component.html",
  styleUrls: ["./list-manage-services.component.css"],
})
export class ListManageServicesComponent implements OnInit {
  private viewPortSubscription: Subscription;
  viewPort: any = "";

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

  public reenableButton = new EventEmitter<boolean>(false);
  @ViewChild(ManageServiceModalComponent, { static: true })
  serviceModal: ManageServiceModalComponent;

  constructor(
    public sharedService: SharedService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    private dialogService: DialogService,
    public servicesApiService: ServicesApiService,
    public rolesService: RolesService,
    public schedulesService: SchedulesService
  ) {}

// sleep time expects milliseconds
sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

  ngOnInit() {
    // this.viewPortSubscription = this.sharedService.viewport.subscribe(
    //   (viewport) => {
    //     this.viewPort = viewport;
    //   }
    // );

    
    this.getServices();
    this.getSchedules();
    // TODO: Use forkJoin
    this.sleep(1000).then(() => {
      this.getInstalledServices();
      this.getAvaiableServices();
    });
  }

  public async getInstalledServices() {
    /** request start */
    this.ngProgress.start();
    await this.servicesApiService
      .getInstalledServices()
      .then((data) => {
        /** request done */
        this.ngProgress.done();
        let svcs = data["services"].filter(
          (s) => !["south", "north", "storage"].includes(s)
        );

        this.installedServicePkgs = this.expectedServices.filter(
          (s) => svcs.includes(s.process) 
        );
        console.log("Installed:");
        console.log(this.installedServicePkgs);

        //
  
        let replacement;
        let atIndex = -1
        this.installedServicePkgs.forEach((installed, idx) =>{
          replacement = structuredClone(installed);
          console.log(this.servicesSchedules)
          let found_svc = this.servicesRegistry.find(s => s.type == installed.type);
          console.log("Found svc: ", found_svc)
          if(found_svc === undefined){
            let found_sch = this.servicesSchedules.find(s => s.processName == installed["schedule_process"]);
            console.log("Found sch: ", found_svc)
            if(found_sch !== undefined){
              replacement.name = found_sch.name;
              replacement.added = true
              atIndex = idx;
            }
          } 
          else {
            replacement.name = found_svc.name;
            replacement.added = true
            replacement.state = found_svc.status; 
            atIndex = idx; 
          } 
        });
        if(atIndex != -1){
          console.log("DOING REPLACEMENT...");
          this.installedServicePkgs[atIndex] = replacement;
          console.log(this.installedServicePkgs);
          console.log("REPLACEMENT DONE!");
        }
      })
      .catch((error) => {
        /** request done */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log("service down ", error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  public async getAvaiableServices() {
    this.ngProgress.start();
    await this.servicesApiService
      .getAvailableServices()
      .then((data) => {
        this.ngProgress.done();
        let svcs = data["services"];
        this.availableServicePkgs = this.expectedServices.filter(
          (s) => svcs.includes(s.package) 
        );

        console.log(this.availableServicePkgs);
      })
      .catch((error) => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log("service down ", error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
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
        
        // REMOVEME
        console.log(expectedTypes)

        this.servicesRegistry = res.services.filter((s) => expectedTypes.includes(s.type));
        
        // REMOVEME
        console.log("servicesRegistry")
        console.log(this.servicesRegistry)
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
        this.servicesSchedules = data.schedules.filter((sch) => expectedP.includes(sch.processName));
        console.log(this.servicesSchedules)
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

  deleteService() {
    this.ngProgress.start();
    this.servicesApiService.deleteService(this.service.name).subscribe(
      (data: any) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertService.success(data["result"], true);
        this.closeModal("delete-confirmation-dialog");
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
    /** request started */
    this.ngProgress.start();
    this.schedulesService.enableScheduleByName(this.service.name).subscribe(
      (data) => {
        /** request completed */
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertService.success(data["message"], true);
      },
      (error) => {
        /** request completed */
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
    /** request started */
    this.ngProgress.start();
    this.schedulesService.disableScheduleByName(this.service.name).subscribe(
      (data) => {
        /** request completed */
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertService.success(data["message"], true);
      },
      (error) => {
        /** request completed */
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
  }
  setService(service) {
    this.service = service;
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  public ngOnDestroy(): void {
    // this.viewPortSubscription.unsubscribe();
  }
}
