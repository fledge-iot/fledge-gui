import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AssetsService, AlertService, PingService } from '../../../../services/index';
import { AssetSummaryComponent } from './../asset-summary/asset-summary.component';
import { ReadingsGraphComponent } from './../readings-graph/readings-graph.component';
import { NgProgress } from 'ngx-progressbar';
import { MAX_INT_SIZE } from '../../../../utils';
import { POLLING_INTERVAL } from '../../../../utils';
import { AnonymousSubscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Rx';

@Component({
  selector: 'app-assets',
  templateUrl: './assets.component.html',
  styleUrls: ['./assets.component.css']
})
export class AssetsComponent implements OnInit, OnDestroy {

  selectedAsset: any; // Selected asset object (assetCode, count)
  MAX_RANGE = MAX_INT_SIZE;
  assets = [];
  assetsReadingsData = [];
  public assetData: Object;
  public isChart = false;
  public refreshInterval = POLLING_INTERVAL;
  private timerSubscription: AnonymousSubscription;
  private postsSubscription: AnonymousSubscription;

  @ViewChild(ReadingsGraphComponent) readingsGraphComponent: ReadingsGraphComponent;

  constructor(private assetService: AssetsService,
    private alertService: AlertService,
    public ngProgress: NgProgress,
    private ping: PingService) { }

  ngOnInit() {
    this.getAsset();
    this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
      this.refreshInterval = timeInterval;
    });
  }

  public getAsset(): void {
    this.assets = [];
    this.assetService.getAsset().
      subscribe(
        (data: any[]) => {
          this.assets = data;
          if (this.selectedAsset) {
            this.selectedAsset = this.assets.find(a => a.assetCode === this.selectedAsset.assetCode);
          }
          this.refreshData();
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  // /**
  //  *  Get data of Asset Readings
  //  */
  // public getAssetReading(): void {
  //   this.assetsReadingsData = [];
  //   /** request started */
  //   this.ngProgress.start();
  //   this.assetService.getAssetReadings(encodeURIComponent(this.selectedAsset['assetCode'])).
  //     subscribe(
  //       data => {
  //         /** request completed */
  //         this.ngProgress.done();
  //         this.assetsReadingsData = [{
  //           assetCode: this.selectedAsset['assetCode'],
  //           data: data
  //         }];
  //         console.log('This is the asset reading data ', this.assetsReadingsData);
  //       },
  //       error => {
  //         /** request completed */
  //         this.ngProgress.done();
  //         if (error.status === 0) {
  //           console.log('service down ', error);
  //         } else {
  //           this.alertService.error(error.statusText);
  //         }
  //       });
  // }

  /**
  * Open asset chart modal dialog
  */
  public showAssetChart(assetCode) {
    this.readingsGraphComponent.plotReadingsGraph(assetCode, 0);
    this.readingsGraphComponent.toggleModal(true);
  }

  public ngOnDestroy(): void {
    if (this.postsSubscription) {
      this.postsSubscription.unsubscribe();
    }
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  private refreshData(): void {
    this.timerSubscription = null;
    this.timerSubscription = Observable.timer(this.refreshInterval)
      .subscribe(() => this.getAsset());
  }

}
