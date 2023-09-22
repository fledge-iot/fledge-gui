import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { orderBy } from 'lodash';
import { takeWhile, takeUntil } from 'rxjs/operators';
import { interval, Subscription, Subject } from 'rxjs';

import { PingService, ServicesApiService, ProgressBarService, SharedService, AssetsService, RolesService } from '../../../services';
import { AlertService } from '../../../services/alert.service';
import { POLLING_INTERVAL } from '../../../utils';
import { SouthServiceModalComponent } from './south-service-modal/south-service-modal.component';
import { ViewLogsComponent } from '../logs/packages-log/view-logs/view-logs.component';
import { DeveloperFeaturesService } from '../../../services/developer-features.service';
import { DialogService } from '../../common/confirmation-dialog/dialog.service';
import { Service } from './south-service';


@Component({
  selector: 'app-south',
  templateUrl: './south.component.html',
  styleUrls: ['./south.component.css']
})
export class SouthComponent implements OnInit, OnDestroy {
  public service: Service;
  public southAseetsExpandedState = [];
  public southboundServices = [];
  public refreshSouthboundServiceInterval = POLLING_INTERVAL;
  public showSpinner = false;
  public isAlive: boolean;
  private subscription: Subscription;
  private viewPortSubscription: Subscription;
  viewPort: any = '';
  selectedAsset = '';
  selectedService = '';
  eventsTrack = [];

  @ViewChild(SouthServiceModalComponent, { static: true }) southServiceModal: SouthServiceModalComponent;
  @ViewChild(ViewLogsComponent) viewLogsComponent: ViewLogsComponent;

  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private servicesApiService: ServicesApiService,
    private alertService: AlertService,
    private assetService: AssetsService,
    public ngProgress: ProgressBarService,
    public developerFeaturesService: DeveloperFeaturesService,
    private router: Router,
    private ping: PingService,
    private dialogService: DialogService,
    private sharedService: SharedService,
    public rolesService: RolesService) {
    this.isAlive = true;
    this.ping.pingIntervalChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((timeInterval: number) => {
        if (timeInterval === -1) {
          this.isAlive = false;
        }
        this.refreshSouthboundServiceInterval = timeInterval;
      });
  }

  ngOnInit() {
    this.showLoadingSpinner();
    this.getSouthboundServices(false);
    interval(this.refreshSouthboundServiceInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        this.getSouthboundServices(true);
      });
    this.subscription = this.sharedService.showLogs
      .subscribe(showPackageLogs => {
        if (showPackageLogs.isSubscribed) {
          // const closeBtn = <HTMLDivElement>document.querySelector('.modal .delete');
          // if (closeBtn) {
          //   closeBtn.click();
          // }
          this.viewLogsComponent.toggleModal(true, showPackageLogs.fileLink);
          showPackageLogs.isSubscribed = false;
        }
      });
    this.viewPortSubscription = this.sharedService.viewport
      .subscribe(viewport => {
        this.viewPort = viewport;
      });
  }

  public getSouthboundServices(caching: boolean) {
    this.servicesApiService.getSouthServices(caching)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any) => {
          let enabledServices = [];
          let disabledServices = [];
          this.southboundServices = data['services'];
          this.southboundServices.forEach((svc) => {
            svc.assets = orderBy(svc.assets, ['asset'], ['asc']);
            if (svc['status'] && svc['status'] !== "shutdown") {
              enabledServices.push(svc)
            } else {
              disabledServices.push(svc)
            }
          });
          this.southboundServices = orderBy(enabledServices, 'name').concat(orderBy(disabledServices, 'name'));
          // add expanded key in service to show/hide the assets in the service row
          this.southboundServices.map((svc: any) => {
            svc.expanded = false;
            const ss = this.southAseetsExpandedState.find(s => s.name === svc.name);
            if (ss) {
              svc.expanded = ss.expanded;
            }
            return svc;
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

  showHideAsset(svc: any) {
    this.southboundServices.map((s) => {
      if (svc.name === s.name) {
        const index = this.southAseetsExpandedState.findIndex(s => s.name === svc.name);
        if (index != -1) {
          this.southAseetsExpandedState[index].expanded = !this.southAseetsExpandedState[index].expanded;
          s.expanded = this.southAseetsExpandedState[index].expanded;;
        } else {
          s.expanded = !s.expanded;
          this.southAseetsExpandedState.push(s);
        }
      }
      return s;
    });
  }

  addSouthService() {
    this.router.navigate(['/south/add']);
  }

  /**
 * Open create scheduler modal dialog
 */
  openSouthServiceModal(service: Service) {
    // this.service = service;
    // this.southServiceModal.service = service;
    // this.southServiceModal.toggleModal(true);
    this.router.navigate(['/south', service.name])
  }

  onNotify() {
    this.getSouthboundServices(false);
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  selectAsset(serviceName: string, assetName: string) {
    this.selectedAsset = assetName;
    this.selectedService = serviceName;
  }

  deprecateAsset(assetName: string) {
    /** request started */
    this.ngProgress.start();
    this.assetService.deprecateAssetTrackEntry(this.selectedService, assetName, 'Ingest')
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data.success);
          this.closeModal('asset-tracking-dialog');
          this.getSouthboundServices(false);
        }, error => {
          /** request completed but error */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
    this.subscription.unsubscribe();
    this.viewPortSubscription.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
