import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NgProgress } from 'ngx-progressbar';
import { Observable } from 'rxjs/Rx';
import { AnonymousSubscription } from 'rxjs/Subscription';

import { PingService, ServicesHealthService } from '../../../services';
import { AlertService } from '../../../services/alert.service';
import { POLLING_INTERVAL } from '../../../utils';
import { SouthServiceModalComponent } from './south-service-modal/south-service-modal.component';

@Component({
  selector: 'app-south',
  templateUrl: './south.component.html',
  styleUrls: ['./south.component.css']
})
export class SouthComponent implements OnInit, OnDestroy {
  public service;
  public southboundServices = [];
  private timerSubscription: AnonymousSubscription;
  public refreshSouthboundServiceInterval = POLLING_INTERVAL;

  @ViewChild(SouthServiceModalComponent) southServiceModal: SouthServiceModalComponent;

  constructor(private servicesHealthService: ServicesHealthService,
    private alertService: AlertService,
    public ngProgress: NgProgress,
    private router: Router,
    private ping: PingService) { }

  ngOnInit() {
    this.getSouthboundServices();
    this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
      this.refreshSouthboundServiceInterval = timeInterval;
    });
  }

  public getSouthboundServices() {
    this.servicesHealthService.getSouthServices().
      subscribe(
        (data: any) => {
          this.southboundServices = data['services'];
          if (this.refreshSouthboundServiceInterval > 0) {
            this.refreshSouthboundServices();
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

  addSouthService() {
    this.router.navigate(['/south/add']);
  }

  /**
 * Open create scheduler modal dialog
 */
  openSouthServiceModal(service) {
    this.service = service;
    this.southServiceModal.toggleModal(true);
  }

  onNotify() {
    this.getSouthboundServices();
  }

  private refreshSouthboundServices(): void {
    this.timerSubscription = Observable.timer(this.refreshSouthboundServiceInterval)
      .subscribe(() => { if (this.refreshSouthboundServiceInterval > 0) { this.getSouthboundServices(); } });
  }

  public ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  }
}
