import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AssetsService, AlertService, PingService } from '../../../../services/index';
import { ReadingsGraphComponent } from './../readings-graph/readings-graph.component';
import { MAX_INT_SIZE, POLLING_INTERVAL } from '../../../../utils';
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
  public assetData: Object;
  public isChart = false;
  public refreshInterval = POLLING_INTERVAL;
  private timerSubscription: AnonymousSubscription;

  @ViewChild(ReadingsGraphComponent) readingsGraphComponent: ReadingsGraphComponent;

  constructor(private assetService: AssetsService,
    private alertService: AlertService,
    private ping: PingService) { }

  ngOnInit() {
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
          if (this.selectedAsset) {
            this.selectedAsset = this.assets.find(a => a.assetCode === this.selectedAsset.assetCode);
          }
          if (this.refreshInterval !== 0) {
            this.refreshData();
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

  /**
  * Open asset chart modal dialog
  */
  public showAssetChart(assetCode) {
    this.readingsGraphComponent.plotReadingsGraph(assetCode, 0);
    this.readingsGraphComponent.toggleModal(true);
  }

  public ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  }

  private refreshData(): void {
    this.timerSubscription = Observable.timer(this.refreshInterval)
      .subscribe(() => this.getAsset());
  }

}
