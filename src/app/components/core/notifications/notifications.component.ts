import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { sortBy } from 'lodash';
import { map } from 'rxjs/operators';

import {
  AlertService, NotificationsService, ProgressBarService, SchedulesService, ServicesHealthService
} from '../../../services';
import { AlertDialogComponent } from '../../common/alert-dialog/alert-dialog.component';
import { NotificationModalComponent } from './notification-modal/notification-modal.component';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  providers: [ServicesHealthService]
})
export class NotificationsComponent implements OnInit {

  isNotificationServiceAvailable = false;
  isNotificationServiceEnabled = false;
  notificationServiceName = 'FogLAMP Notifications';
  notificationInstances = [];
  notification: any;
  public notificationServiceRecord: any;

  public showSpinner = false;
  isNotificationModalOpen = false;
  @ViewChild(NotificationModalComponent) notificationModal: NotificationModalComponent;
  @ViewChild(AlertDialogComponent) child: AlertDialogComponent;

  constructor(public servicesHealthService: ServicesHealthService,
    public schedulesService: SchedulesService,
    public notificationService: NotificationsService,
    public ngProgress: ProgressBarService,
    public alertService: AlertService,
    private route: ActivatedRoute,
    public router: Router) { }

  ngOnInit() {
    this.route.data.pipe(map(data => data['service'].services))
      .subscribe(res => {
        const service = res.find((svc: any) => {
          if (svc.type === 'Notification') {
            return svc;
          }
        });
        if (service) {
          this.notificationServiceName = service.name;
          this.isNotificationServiceAvailable = true;
          this.isNotificationServiceEnabled = true;
          if (service.status.toLowerCase() === 'shutdown') {
            this.isNotificationServiceEnabled = false;
          }
        } else {
          this.getSchedules();
        }
      },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
    this.getNotificationInstance();
  }

  addNotificationService() {
    const payload = {
      name: this.notificationServiceName,
      type: 'notification',
      enabled: true
    };

    /** request start */
    this.ngProgress.start();

    this.servicesHealthService.addService(payload)
      .subscribe(
        () => {
          /** request done */
          this.ngProgress.done();
          this.alertService.success('Notification service added successfully.', true);
          this.isNotificationServiceAvailable = true;
          this.isNotificationServiceEnabled = true;
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

  public getSchedules(): void {
    this.schedulesService.getSchedules().
      subscribe(
        (data: any) => {
          const schedule = data.schedules.find((item: any) => {
            if (item.processName === 'notification_c' && item.enabled === false) {
              return item;
            }
          });
          if (schedule !== undefined) {
            this.notificationServiceName = schedule.name;
            this.isNotificationServiceAvailable = true;
            this.isNotificationServiceEnabled = false;
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

  enableNotificationService() {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.enableScheduleByName(this.notificationServiceName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data['message'], true);
          this.isNotificationServiceEnabled = true;
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

  public getNotificationInstance() {
    this.notificationService.getNotificationInstance().
      subscribe(
        (data: any) => {
          this.notificationInstances = data['notifications'];
          this.notificationInstances = sortBy(this.notificationInstances, function (svc) {
            return svc['enable'] === 'false';
          });
          this.hideLoadingSpinner();
        },
        error => {
          this.hideLoadingSpinner();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  onNotify() {
    this.isNotificationModalOpen = false;
    setTimeout(() => {
      this.getNotificationInstance();
    }, 2000);
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  openNotificationInstanceModal(instance: any) {
    this.isNotificationModalOpen = true;
    this.notification = instance;
    this.notification.notificationEnabled = true;
    if (this.isNotificationServiceAvailable && !this.isNotificationServiceEnabled) {
      this.notification.notificationEnabled = false;
    }
    this.notificationModal.notification = instance;
    this.notificationModal.toggleModal(true);
  }

  addNotificationInstance() {
    this.router.navigate(['/notification/add']);
  }

  public closeMessage(isOpen: Boolean) {
    const modalName = <HTMLElement>document.getElementById('messageDiv');
    if (isOpen) {
      modalName.classList.add('is-hidden');
      return;
    }
    modalName.classList.remove('is-hidden');
  }

  openAlertModal() {
    this.notificationServiceRecord = {
      name: this.notificationServiceName,
      message: `Do you really want to disable ${this.notificationServiceName}`,
      key: 'disableNotification'
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }
}
