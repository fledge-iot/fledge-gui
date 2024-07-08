import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { sortBy } from 'lodash';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AlertService, NotificationsService, SharedService, ProgressBarService, SchedulesService, ServicesApiService, RolesService
} from '../../../services';
import { AdditionalServicesUtils } from '../developer/additional-services/additional-services-utils.service';
import { AlertDialogComponent } from '../../common/alert-dialog/alert-dialog.component';
import { NotificationModalComponent } from './notification-modal/notification-modal.component';
import { ViewLogsComponent } from '../logs/packages-log/view-logs/view-logs.component';
import { ServiceWarningComponent } from './service-warning/service-warning.component';
import { ServiceConfigComponent } from './service-config/service-config.component';
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
  serviceInfo: {};
  isServiceAvailable = false;

  public notificationServiceRecord: any;
  public notificationServiceInstalled = false;
  private subscription: Subscription;
  private modalSub: Subscription;
  private viewPortSubscription: Subscription;
  private serviceDetailsSubscription: Subscription;
  public showSpinner = false;

  isNotificationServiceEnable: boolean;

  @ViewChild(NotificationModalComponent, { static: true }) notificationModal: NotificationModalComponent;
  @ViewChild(AlertDialogComponent) child: AlertDialogComponent;
  @ViewChild(ViewLogsComponent) viewLogsComponent: ViewLogsComponent;
  @ViewChild(ServiceWarningComponent, { static: true }) notificationServiceWarningComponent: ServiceWarningComponent;
  @ViewChild(ServiceConfigComponent, { static: true }) notificationServiceConfigComponent: ServiceConfigComponent;

  constructor(
    public servicesApiService: ServicesApiService,
    public schedulesService: SchedulesService,
    public notificationService: NotificationsService,
    public ngProgress: ProgressBarService,
    public alertService: AlertService,
    public router: Router,
    public docService: DocService,
    public activatedRoute: ActivatedRoute,
    private sharedService: SharedService,
    private additionalServicesUtils: AdditionalServicesUtils,
    public rolesService: RolesService) {
    this.activatedRoute.paramMap
      .pipe(map(() => window.history.state)).subscribe(data => {
        if (!data?.shouldSkipCalls) {
          this.additionalServicesUtils.getAllServiceStatus(false, 'notification');
        }
      })
  }

  ngOnInit() {
    this.serviceDetailsSubscription = this.sharedService.installedServicePkgs.subscribe(service => {
      if (service) {
        const notificationServiceDetail = service.installed.find(s => s.process == 'notification');
        if (notificationServiceDetail) {
          this.isNotificationServiceEnabled = ["shutdown", "disabled", "installed"].includes(notificationServiceDetail?.state) ? false : true;
          this.notificationServiceInstalled = true;
          this.isNotificationServiceAvailable = notificationServiceDetail?.added;
          this.notificationServiceName = notificationServiceDetail.name;
        } else {
          this.isNotificationServiceEnabled = false;
          this.notificationServiceInstalled = false;
          this.isNotificationServiceAvailable = false;
          this.notificationServiceName = '';
        }
      }
    });
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

  refreshServiceInfo() {
    this.additionalServicesUtils.getAllServiceStatus(false, 'notification');
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

  /**
   * Open Configure Service modal
   */
  openServiceConfigureModal() {
    const serviceInfo = {
      name: this.notificationServiceName,
      isEnabled: this.isNotificationServiceEnabled,
      added: this.isNotificationServiceAvailable,
      process: 'notification',
      isInstalled: this.notificationServiceInstalled
    }
    this.router.navigate(['/developer/options/additional-services/config'], { state: { ...serviceInfo } });
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
    this.serviceDetailsSubscription.unsubscribe();
  }
}
