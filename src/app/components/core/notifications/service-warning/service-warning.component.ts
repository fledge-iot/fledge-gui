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
export class ServiceWarningComponent implements OnInit {
  private viewPortSubscription: Subscription;
  private subscription: Subscription;
  showConfigureModal = false;

  @Output() serviceConfigureModal = new EventEmitter<Object>();
  @Output() refreshService = new EventEmitter<any>();

  @Input() service;
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

  ngOnInit(): void { }

  // ngOnChanges(changes: SimpleChanges) {
  //   console.log('changes', changes);
  //   console.log('serviceType', this.serviceType);
  //   console.log('service22', this.service);
  //   if (changes && changes?.service?.currentValue?.process === this.serviceType.toLowerCase()) {
  //     this.service = changes.service?.currentValue;
  //     console.log('currentValue', changes.service?.currentValue);
  //     console.log('service33', this.service);
  //   }
  // }

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
