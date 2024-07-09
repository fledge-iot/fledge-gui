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
  isNotificationModalOpen = false;
  notificationInstances = [];
  notification: any;
  viewPort: any = '';

  public notificationServiceRecord: any;
  private subscription: Subscription;
  private modalSub: Subscription;
  private viewPortSubscription: Subscription;
  private serviceDetailsSubscription: Subscription;
  private paramsSubscription: Subscription;
  public showSpinner = false;

  isNotificationServiceEnable: boolean;

  serviceInfo = { added: false, isEnabled: true, name: '', isInstalled: false, process: 'notification' };

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
    // If we are redirecting back after enabling/disabling/adding the service then no need to make all calls again
    this.paramsSubscription = this.activatedRoute.paramMap
      .pipe(map(() => window.history.state)).subscribe(data => {
        if (!data?.shouldSkipCalls) {
          this.additionalServicesUtils.getAllServiceStatus(false, 'notification');
        }
      })
    // Issue may cause by refreshing the page because of old state data, so need to update history state
    history.replaceState({ shouldSkipCalls: false }, '');
  }

  ngOnInit() {
    this.serviceDetailsSubscription = this.sharedService.installedServicePkgs.subscribe(service => {
      if (service.installed) {
        this.serviceInfo = service.installed;
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
    if (this.serviceInfo.added && !this.serviceInfo.isEnabled) {
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
    this.router.navigate(['/developer/options/additional-services/config'], { state: { ...this.serviceInfo } });
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
    this.paramsSubscription.unsubscribe();
  }
}
