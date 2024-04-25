import { Component, OnInit, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProgressBarService, SchedulesService, ServicesApiService, SharedService, RolesService } from '../../../../services';
import { NotificationsService } from '../../../../services/notifications.service';
import { DocService } from '../../../../services/doc.service';

@Component({
  selector: 'app-notification-service-warning',
  templateUrl: './notification-service-warning.component.html',
  styleUrls: ['./notification-service-warning.component.css']
})
export class NotificationServiceWarningComponent implements OnInit {
  private viewPortSubscription: Subscription;
  private subscription: Subscription;
  notificationServiceInstalled: boolean;
  notificationServiceAdded: boolean;
  notificationServiceEnabled: boolean;
  notificationServiceName = '';
  showConfigureModal = false;

  @Output() serviceStatusEvent = new EventEmitter<boolean>();
  @Output() serviceConfigureModal = new EventEmitter<Object>();
  
  constructor(
    public notificationsService: NotificationsService,
    public sharedService: SharedService,
    public schedulesService: SchedulesService,
    public servicesApiService: ServicesApiService,
    public ngProgress: ProgressBarService,
    public docService: DocService,
    public rolesService: RolesService
  ) { }

  ngOnInit(): void {
    this.getInstalledServicesList();
  }

  public getInstalledServicesList() {
    /** request start */
    this.ngProgress.start();
    this.servicesApiService.getInstalledServices().
      then((data: any) => {
        /** request done */
        this.ngProgress.done();
        // Check if notification service available in installed services list
        this.notificationServiceInstalled = data.services.includes('notification');
        if (this.notificationServiceInstalled) {
          this.getSchedules();
        } else {
          this.notificationServiceInstalled = false;
          this.notificationServiceAdded = false;
          this.notificationServiceEnabled = false;
          this.serviceStatusEvent.emit(this.notificationServiceInstalled && this.notificationServiceAdded);
          this.emitData();
        }
        console.log('notificationServiceEnabled', this.notificationServiceEnabled);
      })
      .catch(error => {
        /** request done */
        this.ngProgress.done();
        console.log('service down ', error);
      });
  }

  public getSchedules(): void {
    /** request start */
    this.ngProgress.start();
    this.schedulesService.getSchedules().
      subscribe(
        (data: any) => {
          /** request done */
          this.ngProgress.done();
          const schedule = data.schedules.find((item: any) => item.processName === 'notification_c');
          this.notificationServiceEnabled = false;
          this.notificationServiceAdded = false;
          this.notificationServiceName = '';
          if (schedule) {
            this.notificationServiceAdded = true;
            this.notificationServiceName = schedule.name;
          }
          if (schedule?.enabled) {
            this.notificationServiceEnabled = true;
          }
          this.serviceStatusEvent.emit(this.notificationServiceInstalled && this.notificationServiceAdded);      
          this.emitData();
        },
        error => {
          /** request done */
          this.ngProgress.done();
          console.log('service down ', error);
        });
  }

  /**
   * refresh even trigger
   * @param tab selected control name
   */
  refresh(tab: string) {
    this.notificationsService.triggerRefreshEvent.next(tab);
  }

  /**
   * Open Configure Service modal
   */
  openConfigureModal() {
    this.emitData(true);
  }

  emitData(isOpenModal = false) {
    const serviceInfo = {
      name: this.notificationServiceName,
      isEnabled: this.notificationServiceEnabled,
      added: this.notificationServiceAdded,
      process: 'notification',
      isInstalled: this.notificationServiceInstalled,
      isOpen: isOpenModal
    }
    this.serviceConfigureModal.emit(serviceInfo);
  }

  public ngOnDestroy(): void {
    if (this.viewPortSubscription) {
      this.viewPortSubscription.unsubscribe();
    }

    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
