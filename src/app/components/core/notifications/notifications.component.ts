import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { sortBy } from 'lodash';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import {
  AlertService, NotificationsService, SharedService, ProgressBarService, SchedulesService, ServicesApiService, RolesService
} from '../../../services';
import { AlertDialogComponent } from '../../common/alert-dialog/alert-dialog.component';
import { NotificationModalComponent } from './notification-modal/notification-modal.component';
import { ViewLogsComponent } from '../logs/packages-log/view-logs/view-logs.component';
import { AdditionalServiceModalComponent } from '../developer/additional-services/additional-service-modal/additional-service-modal.component';

import { DocService } from '../../../services/doc.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  providers: [ServicesApiService]
})
export class NotificationsComponent implements OnInit, OnDestroy {

  isNotificationServiceAvailable: boolean;
  isNotificationServiceEnabled: boolean;
  isNotificationModalOpen = false;
  notificationServiceName = '';
  notificationInstances = [];
  notification: any;
  viewPort: any = '';

  public notificationServiceRecord: any;
  public notificationServiceInstalled = false;
  private subscription: Subscription;
  private modalSub: Subscription;
  private viewPortSubscription: Subscription;
  public showSpinner = false;
  public showConfigureModal = false;

  @ViewChild(NotificationModalComponent, { static: true }) notificationModal: NotificationModalComponent;
  @ViewChild(AlertDialogComponent) child: AlertDialogComponent;
  @ViewChild(ViewLogsComponent) viewLogsComponent: ViewLogsComponent;
  @ViewChild(AdditionalServiceModalComponent, { static: true }) additionalServiceModalComponent: AdditionalServiceModalComponent;
  
  constructor(
    public servicesApiService: ServicesApiService,
    public schedulesService: SchedulesService,
    public notificationService: NotificationsService,
    public ngProgress: ProgressBarService,
    public alertService: AlertService,
    private route: ActivatedRoute,
    public router: Router,
    public docService: DocService,
    private sharedService: SharedService,
    public rolesService: RolesService) { }

  ngOnInit() {
    this.onNotifySettingModal();
    this.checkNotificationServiceStatus();
    this.getNotificationInstance();
    this.subscription = this.sharedService.showLogs.subscribe(showPackageLogs => {
      if (showPackageLogs.isSubscribed) {
        this.viewLogsComponent.toggleModal(true, showPackageLogs.fileLink);
        showPackageLogs.isSubscribed = false;
      }
    });
    this.viewPortSubscription = this.sharedService.viewport.subscribe(viewport => {
      this.viewPort = viewport;
    });
  }

  public async checkNotificationServiceStatus(refresh: boolean = false) {
    await this.getInstalledServicesList();  
    if (this.notificationServiceInstalled) {
      if (refresh) {
        this.checkServiceStatus();
        return;
      }
      this.checkInstalledServices();
    } else {
      this.notificationServiceInstalled = false;
      this.isNotificationServiceAvailable = false;
      this.isNotificationServiceEnabled = false;
    }
  }

  public async getInstalledServicesList() {
    /** request start */
    this.ngProgress.start();
    await this.servicesApiService.getInstalledServices().
      then(data => {
        /** request done */
        this.ngProgress.done();
        this.notificationServiceInstalled = data['services'].includes('notification');
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

  public getNotificationInstance() {
    this.showLoadingSpinner();
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

  onNotifySettingModal() {
    this.modalSub = this.notificationService.notifyServiceEmitter
      .subscribe(event => {
        if (event === null) { return; }
        if (event.isEnabled !== undefined) {
          this.isNotificationServiceEnabled = event.isEnabled;
        }
        if (event.isAddDeleteAction !== undefined) {
          setTimeout(() => {
            this.checkNotificationServiceStatus(true);
          }, 2000);
        }
        if (event.isConfigChanged !== undefined) {
          this.checkServiceStatus();
        }
      });
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
    this.notificationModal.getNotificationCategory();
    this.notificationModal.toggleModal(true);
  }

  addNotificationInstance() {
    this.router.navigate(['/notification/add']);
  }

  public checkServiceStatus() {
    /** request start */
    this.ngProgress.start();
    this.servicesApiService.getAllServices()
      .subscribe((res: any) => {
        /** request done */
        this.ngProgress.done();
        const service = res.services.find((svc: any) => {
          if (svc.type === 'Notification') {
            return svc;
          }
        });
        this.checkServiceEnabled(service);
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

  checkInstalledServices() {
    this.route.data.pipe(map(data => data['service'].services))
      .subscribe(res => {
        const service = res.find((svc: any) => {
          if (svc.type === 'Notification') {
            return svc;
          }
        });
        this.checkServiceEnabled(service);
      },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  checkServiceEnabled(service: any) {
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
  }

  public getSchedules(): void {
    this.schedulesService.getSchedules().
      subscribe(
        (data: any) => {
          const schedule = data.schedules.find((item: any) => item.processName === 'notification_c');
          if (schedule === undefined) {
            this.isNotificationServiceAvailable = false;
            this.isNotificationServiceEnabled = false;
            this.notificationServiceName = '';
            return;
          }
          this.notificationServiceName = schedule.name;
          this.isNotificationServiceAvailable = true;
          if (schedule.enabled) {
            this.isNotificationServiceEnabled = true;
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
   * Open Configure Service modal
   */
   openServiceConfigureModal() {
    const serviceInfo = {
      name: this.notificationServiceName,
      isEnabled: this.isNotificationServiceEnabled,
      added: this.isNotificationServiceAvailable,
      process: 'notification',
      type: 'Notification',
      package: 'fledge-service-notification',
      isInstalled: this.notificationServiceInstalled
    }
    this.showConfigureModal = true;
    this.additionalServiceModalComponent.toggleModal(true);
    this.additionalServiceModalComponent.getServiceInfo(serviceInfo, null, 'notification');
  }

  onNotifyConfigureModal(event = false) {
    if (!event) {
      // enabling/disabling service is taking time to get updated state, so need to add some wait
      setTimeout(() => {
        this.checkNotificationServiceStatus(true);
      }, 3000);
    }
  }

  goToLink(urlSlug: string) {
    this.docService.goToServiceDocLink(urlSlug, 'fledge-service-notification');
  }

  ngOnDestroy() {
    if (this.modalSub) {
      this.modalSub.unsubscribe();
    }
    this.subscription.unsubscribe();
    this.viewPortSubscription.unsubscribe();
  }
}
