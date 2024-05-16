import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
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
  showConfigureModal = false;

  @Output() serviceConfigureModal = new EventEmitter<Object>();

  @Input() isEnabled: boolean;
  @Input() isInstalled: boolean;
  @Input() isAvailable: boolean;
  @Input() serviceName: string;
  
  constructor(
    public notificationsService: NotificationsService,
    public sharedService: SharedService,
    public schedulesService: SchedulesService,
    public servicesApiService: ServicesApiService,
    public ngProgress: ProgressBarService,
    public docService: DocService,
    public rolesService: RolesService
  ) { }

  ngOnInit(): void {}

  /**
   * Open Configure Service modal
   */
  openConfigureModal() {
    this.emitData(true);
  }

  emitData(isOpenModal = false) {
    const serviceInfo = {
      name: this.serviceName,
      isEnabled: this.isEnabled,
      added: this.isAvailable,
      process: 'notification',
      isInstalled: this.isInstalled,
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
