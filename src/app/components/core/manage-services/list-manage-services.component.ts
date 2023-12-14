import { Component, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { orderBy } from 'lodash';

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
  services = [{ type: 'Notification'}, { type: 'Dispatcher'}, { type: 'BucketStorage'}, { type: 'Poll Agent'}];
  installedServices = [];

  serviceData = {};
  installedExternalServices = [];
  servicesData = [];

  service: any;
  
  public reenableButton = new EventEmitter<boolean>(false);
  @ViewChild(ManageServiceModalComponent, { static: true }) serviceModal: ManageServiceModalComponent;

  constructor(
    public sharedService: SharedService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    private dialogService: DialogService,
    public servicesApiService: ServicesApiService,
    public rolesService: RolesService,
    public schedulesService: SchedulesService) { }

  async ngOnInit(): Promise<void> {
    this.viewPortSubscription = this.sharedService.viewport
      .subscribe(viewport => {
        this.viewPort = viewport;
      });
      this.servicesData = this.services.sort((a, b) => a.type.localeCompare(b.type));
      this.checkSelectedServiceStatus();
  }

  public async checkSelectedServiceStatus() {
    this.installedExternalServices = [];
    await this.getInstalledServicesList();
    for (const service of this.services) {
      if (this.installedServices.includes(service.type.toLowerCase())) {
        this.checkInstalledServices(service.type);
        this.getServiceByType(service.type);
      } else {
        const selectedService = this.servicesData.find((s) => s.type === service?.type);
        selectedService.isServiceAvailable = false;
        selectedService.isServiceEnabled = false;
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
        const availableServices = this.servicesData?.filter((s) => s.type !== res.services[0].type);
        this.installedExternalServices.push(res.services[0]); 

        const availableServicesNames  = new Set(this.installedExternalServices.map(({ name }) => name));
        this.servicesData = [
          ...orderBy(this.installedExternalServices, 'name'),
          ...orderBy(availableServices, 'name').filter(({ name }) => !availableServicesNames.has(name))
        ];
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
    const selectedService = this.servicesData.find((s) => s.type === service?.type);
    if (service) {    
      selectedService.name = service.name;
      selectedService.isServiceAvailable = true;
      selectedService.isServiceEnabled = true;
      selectedService.status = service.status;
      if (service.status.toLowerCase() === 'shutdown') {
        selectedService.isServiceEnabled = false;
      }
    } else {
      this.getSchedules(serviceName);
    }
  }

  public getSchedules(serviceName): void {
    const selectedService = this.servicesData.find((s) => s.type === serviceName);
    this.schedulesService.getSchedules().
      subscribe(
        (data: any) => {
          const schedule = data.schedules.find((item: any) => item.processName === serviceName + '_c');
          if (schedule === undefined) {
            selectedService.isServiceAvailable = false;
            selectedService.isServiceEnabled = false;
            selectedService.name = '';
            return;
          }
          selectedService.name = schedule.name;
          selectedService.isServiceAvailable = true;
          if (schedule.enabled) {
            selectedService.isServiceEnabled = true;
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
    const selectedService = this.servicesData.find((s) => s.type === service);
    selectedService.serviceModalName = service;
    this.serviceData = selectedService;
    this.serviceModal.toggleModal(true);
  }

  deleteService() {
    this.ngProgress.start();
    this.servicesApiService.deleteService(this.service.name)
      .subscribe(
        (data: any) => {
          this.ngProgress.done();
          this.reenableButton.emit(false);
          this.alertService.success(data['result'], true);
          this.closeModal('delete-confirmation-dialog');
          this.checkSelectedServiceStatus();
        },
        error => {
          this.ngProgress.done();
          this.reenableButton.emit(false);
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  stateUpdate() {
    if (this.service.status === 'shutdown') {
      this.enableService();
    } else {
      this.disableService();
    }
  }

  enableService() {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.enableScheduleByName(this.service.name).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.reenableButton.emit(false);
          this.alertService.success(data['message'], true);
          const selectedService = this.servicesData.find((s) => s.name === this.service.name);
          selectedService.isServiceEnabled = true;
          this.closeModal('confirmation-dialog');
          this.checkSelectedServiceStatus();
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          this.reenableButton.emit(false);
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  disableService() {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.disableScheduleByName(this.service.name).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.reenableButton.emit(false);
          this.alertService.success(data['message'], true);
          const selectedService = this.servicesData.find((s) => s.name === this.service.name);
          selectedService.isServiceEnabled = false;
          this.closeModal('confirmation-dialog');
          this.checkSelectedServiceStatus();
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          this.reenableButton.emit(false);
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  applyClass(serviceStatus: string) {
    if (serviceStatus.toLowerCase() === 'running') {
      return 'is-info';
    }
    if (serviceStatus.toLowerCase() === 'unresponsive') {
      return 'is-warning';
    }
    if (serviceStatus.toLowerCase() === 'shutdown') {
      return 'is-lighter';
    }
    if (serviceStatus.toLowerCase() === 'failed') {
      return 'is-danger';
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
    this.viewPortSubscription.unsubscribe();
  }
}
