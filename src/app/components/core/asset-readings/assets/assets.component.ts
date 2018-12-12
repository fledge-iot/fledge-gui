import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Parser } from 'json2csv';
import { orderBy } from 'lodash';
import { interval } from 'rxjs';

import { AlertService, AssetsService, PingService } from '../../../../services';
import { MAX_INT_SIZE, POLLING_INTERVAL } from '../../../../utils';
import { ReadingsGraphComponent } from '../readings-graph/readings-graph.component';

@Component({
  selector: 'app-assets',
  templateUrl: './assets.component.html',
  styleUrls: ['./assets.component.css']
})
export class AssetsComponent implements OnInit, OnDestroy {

  selectedAsset: any; // Selected asset object (assetCode, count)
  MAX_RANGE = MAX_INT_SIZE;
  assets = [];
  public refreshInterval = POLLING_INTERVAL;
  public showSpinner = false;
  private isAlive: boolean;

  @ViewChild(ReadingsGraphComponent) readingsGraphComponent: ReadingsGraphComponent;

  constructor(private assetService: AssetsService,
    private alertService: AlertService,
    private ping: PingService) {
    this.isAlive = true;
    this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
      if (timeInterval === -1) {
        this.isAlive = false;
      }
      this.refreshInterval = timeInterval;
    });
  }

  ngOnInit() {
    this.showLoadingSpinner();
    this.getAsset();
    interval(this.refreshInterval)
      .takeWhile(() => this.isAlive) // only fires when component is alive
      .subscribe(() => {
        this.getAsset();
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

  getAssetReadings(assetCode, recordCount) {
    const fields = ['timestamp', 'reading'];
    const opts = { fields };
    if (recordCount === 0) {
      this.alertService.error('No reading to export.');
    }
    this.assetService.getAssetReadings(encodeURIComponent(assetCode), recordCount).
      subscribe(
        (data: any[]) => {
          const parser = new Parser(opts);
          const csv = parser.parse(data);
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          // create a custom anchor tag
          const a = document.createElement('a');
          a.href = url;
          a.download = assetCode + '_readings.csv';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        },
        error => {
          console.log('error in response', error);
        });
  }

  /**
  * Open asset chart modal dialog
  */
  public showAssetChart(assetCode) {
    this.readingsGraphComponent.getAssetCode(assetCode);
    this.readingsGraphComponent.toggleModal(true);
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  onNotify(event) {
    this.isAlive = event;
    interval(this.refreshInterval)
      .takeWhile(() => this.isAlive) // only fires when component is alive
      .subscribe(() => {
        this.getAsset();
      });
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
  }
}
