import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { orderBy } from 'lodash';
import { Observable } from 'rxjs/Rx';
import { AnonymousSubscription } from 'rxjs/Subscription';

import { AlertService, AssetsService, PingService } from '../../../../services';
import { MAX_INT_SIZE, POLLING_INTERVAL } from '../../../../utils';
import { ReadingsGraphComponent } from './../readings-graph/readings-graph.component';

@Component({
  selector: 'app-assets',
  templateUrl: './assets.component.html',
  styleUrls: ['./assets.component.css']
})
export class AssetsComponent implements OnInit, OnDestroy {

  selectedAsset: any; // Selected asset object (assetCode, count)
  MAX_RANGE = MAX_INT_SIZE;
  assets = [];
  public assetData: Object;
  public isChart = false;
  public refreshInterval = POLLING_INTERVAL;
  private timerSubscription: AnonymousSubscription;
  public showSpinner = false;
  @ViewChild(ReadingsGraphComponent) readingsGraphComponent: ReadingsGraphComponent;

  constructor(private assetService: AssetsService,
    private alertService: AlertService,
    private ping: PingService) { }

  ngOnInit() {
    this.showLoadingSpinner();
    this.getAsset();
    this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
      this.refreshInterval = timeInterval;
    });
  }

  public getAsset(): void {
    this.assetService.getAsset().
      subscribe(
        (data: any[]) => {
          this.assets = data;
          this.assets = orderBy(this.assets, ['assetCode'], ['asc']);
          if (this.selectedAsset) {
            this.selectedAsset = this.assets.find(a => a.assetCode === this.selectedAsset.assetCode);
          }
          if (this.refreshInterval > 0) {
            this.enableRefreshTimer();
          }
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

  /**
  * Open asset chart modal dialog
  */
  public showAssetChart(assetCode) {
    this.readingsGraphComponent.getAssetCode(assetCode);
    this.readingsGraphComponent.toggleModal(true);
  }

  public ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  }

  private enableRefreshTimer(): void {
    this.timerSubscription = Observable.timer(this.refreshInterval)
      .subscribe(() => this.getAsset());
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }
}
