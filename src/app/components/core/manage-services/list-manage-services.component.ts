import { Component, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

import { AlertService, ProgressBarService, RolesService, ServicesApiService, SchedulesService, NotificationsService } from '../../../services';
import { SharedService } from '../../../services/shared.service';
import { DialogService } from '../../common/confirmation-dialog/dialog.service';
import { ManageServiceModalComponent } from './manage-service-modal/manage-service-modal.component';

@Component({
  selector: 'app-manage-services',
  templateUrl: './list-manage-services.component.html',
  styleUrls: ['./list-manage-services.component.css']
})
export class ListManageServicesComponent implements OnInit {
  private viewPortSubscription: Subscription;
  viewPort: any = '';
  services = ['Notification', 'Dispatcher', 'BucketStorage'];
  installedServices = [];

  serviceAvailable = [];
  serviceEnabled = [];
  serviceData = {};
  serviceNameInfo = [];
  installedExternalServices = [];
  externalServices = [];

  service: any;
  
  public reenableButton = new EventEmitter<boolean>(false);
  @ViewChild(ManageServiceModalComponent, { static: true }) serviceModal: ManageServiceModalComponent;

  constructor(
    public sharedService: SharedService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private notificationService: NotificationsService,
    public servicesApiService: ServicesApiService,
    public rolesService: RolesService,
    public schedulesService: SchedulesService) { }

  async ngOnInit(): Promise<void> {
    this.viewPortSubscription = this.sharedService.viewport
      .subscribe(viewport => {
        this.viewPort = viewport;
      });
      this.checkSelectedServiceStatus();
  }

  public async checkSelectedServiceStatus(refresh: boolean = false) {
    
    
    console.log('availableService4', this.serviceAvailable);
    console.log('serviceEnabled4', this.serviceEnabled);
    await this.getInstalledServicesList();
    this.installedExternalServices = [];
    for (const service of this.services) {
      if (this.installedServices.includes(service.toLowerCase())) {
        if (refresh) {
          this.checkServiceStatus(service);
          return;
        }
        this.checkInstalledServices(service);
        this.getServiceByType(service);
      } else {
        if (this.serviceAvailable && this.serviceEnabled) {    
          console.log('availableService5', this.serviceAvailable);
          console.log('serviceEnabled5', this.serviceEnabled);    
          // const availableService = this.serviceAvailable?.find((s) => s === service);
          // const index: number = this.serviceAvailable.indexOf(service);
          if (this.serviceAvailable.indexOf(service) !== -1) {
            // this.serviceAvailable.splice(this.serviceAvailable.indexOf(service), 1);
            this.serviceAvailable = this.serviceAvailable[this.serviceAvailable.indexOf(service)];
          }

          // console.log('index', index);
          console.log('service11', service);
          // this.serviceAvailable = availableService?.type;

          // const enabledService = this.serviceEnabled?.find((s) => s === service);
          // this.serviceEnabled = enabledService?.type;
          // const index2: number = this.serviceEnabled.indexOf(service);
          if (this.serviceEnabled.indexOf(service) !== -1) {
            // this.serviceEnabled.splice(index2, 1);
            this.serviceEnabled = this.serviceEnabled[this.serviceEnabled.indexOf(service)];
          }
          console.log('availableService6', this.serviceAvailable);
          console.log('serviceEnabled6', this.serviceEnabled);
        }
        this.externalServices = this.services;
      }
    }
  }

  checkInstalledServices(serviceName) {
    this.servicesApiService.getAllServices()
    .subscribe((res: any) => {
      const service = res.services.find((s) => s.type === serviceName);
      this.checkServiceEnabled(service, serviceName);
    },
      (error) => {
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  public async getInstalledServicesList() {
    /** request start */
    this.ngProgress.start();
    await this.servicesApiService.getInstalledServices().
      then(data => {
        /** request done */
        this.ngProgress.done();
        this.installedServices = data['services'];
      })
      .catch(error => {
        /** request done */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  public getServiceByType(service) {
    this.ngProgress.start();
    this.servicesApiService.getServiceByType(service)
      .subscribe((res: any) => {
        this.ngProgress.done();
        this.installedExternalServices.push(res.services[0]);
        this.externalServices = this.services.filter((s) => s !== service);
      },
        (error) => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          }
        });
  }

  public checkServiceStatus(serviceName) {
    /** request start */
    this.ngProgress.start();
    this.servicesApiService.getAllServices()
      .subscribe((res: any) => {
        /** request done */
        this.ngProgress.done();
        const service = res.services.find((svc: any) => {
          if (svc.type === serviceName) {
            return svc;
          }
        });
        this.checkServiceEnabled(service, serviceName);
      },
        (error) => {
          /** request done */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  checkServiceEnabled(service: any, serviceName) {
    console.log('availableService2', this.serviceAvailable);
    console.log('serviceEnabled2', this.serviceEnabled);
    if (service) {
      this.serviceNameInfo.push({key: service.type, value: service.name});
      this.serviceAvailable.push(service.type);
      this.serviceEnabled.push(service.type);
      if (service.status.toLowerCase() === 'shutdown') {
        const enabledService = this.serviceEnabled.find((s) => s !== service);
        this.serviceEnabled = enabledService.type;
      }
    } else {
      this.getSchedules(serviceName);
    }
  }

  public getSchedules(serviceName): void {
    console.log('serviceName99', serviceName);
    console.log('availableService33', this.serviceAvailable);
    console.log('serviceEnabled33', this.serviceEnabled);
    // FixMe
    this.schedulesService.getSchedules().
      subscribe(
        (data: any) => {
          console.log('data.schedules', data.schedules);
          const schedule = data.schedules.find((item: any) => item.processName === serviceName + '_c');
          if (schedule === undefined) {
            if (this.serviceAvailable && this.serviceEnabled ) {
              console.log('serviceAvailable', this.serviceAvailable);
              const availableService = this.serviceAvailable.find((s) => s === serviceName);
              console.log('service', serviceName);
              this.serviceAvailable = availableService?.type;
              const enabledService = this.serviceEnabled.find((s) => s === serviceName);
              this.serviceEnabled = enabledService?.type;
              this.serviceNameInfo = this.serviceNameInfo.filter((s) => s.value === serviceName.name);
            }           
            return;
          }

          this.serviceNameInfo.push({key: serviceName, value: schedule.name});
          this.serviceAvailable.push(serviceName);
          if (schedule.enabled) {
            this.serviceEnabled.push(serviceName);
          }
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  /**
   * Open Settings modal
   */
   openServiceModal(service) {
    this.serviceData = {
      serviceAvailable: this.serviceAvailable,
      serviceEnabled: this.serviceEnabled,
      serviceNameInfo: this.serviceNameInfo,
      serviceModalName: service
    };
    this.serviceModal.toggleModal(true);
  }

  deleteService() {
    this.ngProgress.start();
    this.notificationService.deleteNotificationService(this.service.name)
      .subscribe(
        (data: any) => {
          this.ngProgress.done();
          this.alertService.success(data['result'], true);
          this.notificationService.notifyServiceEmitter.next({ isAddDeleteAction: true });
          this.closeModal('delete-confirmation-dialog');
          this.checkSelectedServiceStatus();
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
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
    this.viewPortSubscription.unsubscribe();
  }
}
