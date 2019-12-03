import { Component, EventEmitter, Output, OnChanges, Input, SimpleChanges, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, NgForm } from '@angular/forms';
import { ProgressBarService, NotificationsService, AlertService, ServicesApiService, SchedulesService,
  ConfigurationService } from '../../../../services';
import {
  ViewConfigItemComponent
} from '../../configuration-manager/view-config-item/view-config-item.component';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';
import { isEmpty } from 'lodash';

@Component({
  selector: 'app-notification-service-modal',
  templateUrl: './notification-service-modal.component.html',
  styleUrls: ['./notification-service-modal.component.css']
})
export class NotificationServiceModalComponent implements OnChanges {
  enabled: Boolean;
  category: any;
  useProxy: string;
  isNotificationServiceAvailable = false;
  isNotificationServiceEnabled = false;
  notificationServiceName = '';
  changedChildConfig = [];
  availableServices = [];
  notificationServicePackageName = 'foglamp-service-notification';
  btnText = 'Add';
  showDeleteBtn = true;
  public notificationServiceRecord;

  @Output() notifyServiceEmitter: EventEmitter<any> = new EventEmitter<any>();
  @Input() notificationServiceData: { notificationServiceAvailable: boolean, notificationServiceEnabled: boolean,
    notificationServiceName: string };
  @ViewChild('notificationConfigView', { static: false }) viewConfigItemComponent: ViewConfigItemComponent;
  @ViewChild('fg', { static: false }) form: NgForm;
  @ViewChild(AlertDialogComponent, { static: true }) child: AlertDialogComponent;

  constructor(public fb: FormBuilder, public ngProgress: ProgressBarService,
    private configService: ConfigurationService, public schedulesService: SchedulesService,
    public servicesApiService: ServicesApiService, public alertService: AlertService,
    private notificationService: NotificationsService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['notificationServiceData']) {
      this.notificationServiceName = this.notificationServiceData.notificationServiceName;
      this.isNotificationServiceEnabled = this.notificationServiceData.notificationServiceEnabled;
      this.isNotificationServiceAvailable = this.notificationServiceData.notificationServiceAvailable;
    }
    this.enabled = this.isNotificationServiceEnabled;
    this.btnText = 'Add';
    this.useProxy = 'false';
    if (this.isNotificationServiceAvailable) {
      this.showDeleteBtn = true;
      this.btnText = 'Save';
      this.getCategory();
    }
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.toggleModal(false);
  }

  public toggleModal(isOpen: Boolean) {
    const notificationServiceModal = <HTMLDivElement>document.getElementById('notification-service-modal');
    if (isOpen) {
      if (this.form.controls['notificationServiceName'] !== undefined) {
        this.form.controls['notificationServiceName'].markAsPristine();
        this.form.controls['enabled'].markAsUntouched();
        this.form.controls['notificationServiceName'].reset();
      }
      notificationServiceModal.classList.add('is-active');
      return;
    }
    notificationServiceModal.classList.remove('is-active');
    this.category = '';
  }

  addNotificationService() {
    const name = this.form.controls['notificationServiceName'].value;
    const payload = {
      name: name,
      type: 'notification',
      enabled: this.form.controls['enabled'].value
    };
    /** request start */
    this.ngProgress.start();

    this.servicesApiService.addService(payload)
      .subscribe(
        () => {
          this.ngProgress.done();
          this.alertService.success('Notification service added successfully.', true);
          this.isNotificationServiceAvailable = true;
          this.btnText = 'Save';
          this.toggleModal(false);
          setTimeout(() => {
            this.notifyServiceEmitter.next({isAddDeleteAction: true});
          }, 2000);
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

  /**
   * Open delete modal
   */
  openDeleteModal(name: string) {
    this.notificationServiceRecord = {
      name: name,
      message: 'Deleting this notification service can not be undone. Continue',
      key: 'deleteNotificationService'
    };
    // call child component method to toggle modal
    this.child.toggleModal(true, '#notification-service-modal ');
  }

  public async getInstalledServicesList() {
    /** request start */
    this.ngProgress.start();
    await this.servicesApiService.getInstalledServices().
      then(data => {
        /** request done */
        this.ngProgress.done();
        this.availableServices = data['services'];
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

  installNotificationService() {
    const servicePayload = {
      format: 'repository',
      name: this.notificationServicePackageName,
      version: ''
    };

    /** request started */
    this.ngProgress.start();
    this.alertService.activityMessage('Installing ' + 'notification service...', true);
    this.servicesApiService.installService(servicePayload).
      subscribe(
        (data: any) => {
          /** request done */
          this.ngProgress.done();
          this.alertService.closeMessage();
          this.alertService.success(data.message, true);
        },
        error => {
          /** request done */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else if (error.status === 500) {
            this.alertService.error('Failed to install from repository');
          } else {
            let errorText = error.statusText;
            if (typeof error.error.link === 'string') {
              errorText += ` <a>${error.error.link}</a>`;
            }
            this.alertService.error(errorText);
          }
        }, () => {
          this.addNotificationService();
        });
  }

  public getCategory(): void {
    /** request started */
    this.ngProgress.start();
    const categoryValues = [];
    this.configService.getCategory(this.notificationServiceName).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            categoryValues.push(data);
            this.category = { key: this.notificationServiceName, value: categoryValues };
            this.useProxy = 'true';
          }
          /** request completed */
          this.ngProgress.done();
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else if (error.status === 404) {   // TODO: FOGL-3499
            this.showDeleteBtn = false;
          } else {
            this.alertService.error(error.statusText, true);
          }
        }
      );
  }

  enableNotificationService(serviceName = null) {
    let notificationServiceName = this.notificationServiceName;
    if (serviceName != null) {
      notificationServiceName = serviceName;
    }
    /** request started */
    this.ngProgress.start();
    this.schedulesService.enableScheduleByName(notificationServiceName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data['message'], true);
          this.isNotificationServiceEnabled = true;
          this.notifyServiceEmitter.next({isEnabled: this.isNotificationServiceEnabled});
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  disableNotificationService() {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.disableScheduleByName(this.notificationServiceName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data['message'], true);
          this.isNotificationServiceEnabled = false;
          this.notifyServiceEmitter.next({isEnabled: this.isNotificationServiceEnabled});
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  deleteNotificationService(notificationName: string) {
    this.ngProgress.start();
    this.notificationService.deleteNotificationService(notificationName)
      .subscribe(
        (data: any) => {
          this.ngProgress.done();
          this.alertService.success(data['result'], true);
          this.notifyServiceEmitter.next({isAddDeleteAction: true});
          this.toggleModal(false);
          this.form.reset();
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

  public async addServiceEvent() {
    await this.getInstalledServicesList();
    if (!this.availableServices.includes('notification')) {
      this.installNotificationService();
    } else {
      this.addNotificationService();
    }
  }

  saveChanges() {
    if (!this.isNotificationServiceAvailable) {
      this.addServiceEvent();
    } else {
      if (this.isNotificationServiceEnabled && !this.form.controls['enabled'].value) {
        this.disableNotificationService();
      }
      if (!this.isNotificationServiceEnabled && this.form.controls['enabled'].value) {
        this.enableNotificationService();
      }
    }
    this.toggleModal(false);
  }

  proxy() {
    if (!this.form.valid) {
      this.form.controls['notificationServiceName'].markAsTouched();
      return;
    }
    if (this.useProxy === 'true') {
      document.getElementById('vci-proxy').click();
    }
    this.updateConfigConfiguration(this.changedChildConfig);
    document.getElementById('hidden-save').click();
    this.notifyServiceEmitter.next({isConfigChanged: true});
  }

  /**
   * Get edited configuration from child config page
   * @param changedConfig changed configuration of a selected plugin
   */
  getChangedConfig(changedConfig) {
    if (isEmpty(changedConfig)) {
      return;
    }
    changedConfig = changedConfig.map(el => {
      return {
        [el.key]: el.value !== undefined ? el.value : el.default,
      };
    });

    changedConfig = Object.assign({}, ...changedConfig); // merge all object into one
    this.changedChildConfig = changedConfig;
  }

  public updateConfigConfiguration(configItems) {
    if (isEmpty(configItems)) {
      return;
    }
    /** request started */
    this.ngProgress.start();
    this.configService.updateBulkConfiguration(this.notificationServiceName, configItems).
      subscribe(
        () => {
          this.changedChildConfig = [];  // clear the array
          /** request completed */
          this.ngProgress.done();
          this.alertService.success('Configuration updated successfully.', true);
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }
}
