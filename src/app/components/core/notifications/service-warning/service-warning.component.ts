import { Component, OnInit, Output, EventEmitter, OnChanges, Input, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProgressBarService, SchedulesService, ServicesApiService, SharedService, RolesService } from '../../../../services';
import { NotificationsService } from '../../../../services/notifications.service';
import { DocService } from '../../../../services/doc.service';

@Component({
  selector: 'app-service-warning',
  templateUrl: './service-warning.component.html',
  styleUrls: ['./service-warning.component.css']
})
export class ServiceWarningComponent implements OnInit, OnChanges {
  private viewPortSubscription: Subscription;
  private subscription: Subscription;
  showConfigureModal = false;

  @Output() serviceConfigureModal = new EventEmitter<Object>();
  @Output() refreshService = new EventEmitter<any>();

  @Input() isEnabled: boolean;
  @Input() isInstalled: boolean;
  @Input() isAvailable: boolean;
  @Input() serviceName: string;
  @Input() serviceType: string;

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

  ngOnChanges(changes: SimpleChanges) {
    if (changes) {
      this.isEnabled = changes?.isEnabled?.currentValue ? changes?.isEnabled?.currentValue : this.isEnabled;
      this.isInstalled = changes?.isInstalled?.currentValue ? changes?.isInstalled?.currentValue : this.isInstalled;
      this.isAvailable = changes?.isAvailable?.currentValue ? changes?.isAvailable?.currentValue : this.isAvailable;
      this.serviceName = changes?.serviceName?.currentValue ? changes?.serviceName?.currentValue : this.serviceName;
    }
  }

  /**
   * Open Configure Service modal
   */
  openConfigureModal() {
    this.serviceConfigureModal.emit();
  }

  public ngOnDestroy(): void {
    if (this.viewPortSubscription) {
      this.viewPortSubscription.unsubscribe();
    }

    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public refreshServiceInfo() {
    this.refreshService.emit();
  }
}
