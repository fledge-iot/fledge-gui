import { Component, OnInit, OnDestroy } from '@angular/core';

import { MomentDatePipe } from '../../../../pipes/moment-date';
import { AssetsService, PingService } from '../../../../services';
import ReadingsValidator from '../assets/readings-validator';
import { AssetSummaryService } from './../asset-summary/asset-summary-service';
import { MAX_INT_SIZE } from '../../../../utils';
import { NgProgress } from 'ngx-progressbar';
import { POLLING_INTERVAL } from '../../../../utils';
import { AnonymousSubscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Rx';

@Component({
  selector: 'app-readings-graph',
  templateUrl: './readings-graph.component.html',
  styleUrls: ['./readings-graph.component.css']
})
export class ReadingsGraphComponent implements OnInit, OnDestroy {
  public assetChart: string;
  public assetReadingValues: any;
  public assetCode;
  public showGraph = true;
  public assetReadingSummary = [];
  public isInvalidLimit = false;
  public MAX_RANGE = MAX_INT_SIZE;
  public DEFAULT_LIMIT = 100;
  public refreshInterval = POLLING_INTERVAL;
  private timerSubscription: AnonymousSubscription;
  private postsSubscription: AnonymousSubscription;
  public limit: number;

  constructor(private assetService: AssetsService,
    private assetSummaryService: AssetSummaryService,
    public ngProgress: NgProgress,
    private ping: PingService) {
    this.assetChart = 'line';
    this.assetReadingValues = [];
  }

  ngOnInit() {
    this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
      this.refreshInterval = timeInterval;
    });
  }

  public toggleModal(shouldOpen: Boolean) {
    const chart_modal = <HTMLDivElement>document.getElementById('chart_modal');
    if (shouldOpen) {
      chart_modal.classList.add('is-active');
      return;
    }
    chart_modal.classList.remove('is-active');
    this.assetCode = '';
  }

  public plotReadingsGraph(assetCode, limit: any) {
    this.isInvalidLimit = false;
    if (limit === undefined || limit === null || limit === '' || limit === 0) {
      limit = this.DEFAULT_LIMIT;
      this.limit = limit;
    }

    if (!Number.isInteger(+limit) || +limit < 0 || +limit > this.MAX_RANGE) { // max limit of int in c++
      this.limit = limit;
      this.isInvalidLimit = true;
      return;
    }

    this.assetCode = assetCode;
    this.ngProgress.start();
    this.assetService.getAssetReadings(encodeURIComponent(assetCode), +limit).
      subscribe(
        (data: any[]) => {
          this.showGraph = true;
          this.ngProgress.done();
          if (data.length === 0) {
            this.getAssetTimeReading(data);
            return;
          }
          const validRecord = ReadingsValidator.validate(data);
          if (validRecord) {
            this.assetSummaryService.getReadingSummary(
              {
                assetCode: assetCode,
                readings: data[0],
              });
            this.assetSummaryService.assetReadingSummary.subscribe(
              value => {
                this.assetReadingSummary = value;
                console.log('readings data to show trends.', this.assetReadingSummary);
              });
            this.getAssetTimeReading(data);
          } else {
            this.showGraph = false;
          }
          this.refreshData();
        },
        error => {
          this.ngProgress.done();
          console.log('error in response', error);
        });
  }

  getAssetTimeReading(assetChartRecord) {
    let assetTimeLabels = [];
    let assetReading = [];
    const first_dataset = [];
    const second_dataset = [];
    const third_dataset = [];
    let d1;
    let d2;
    let d3;
    const datePipe = new MomentDatePipe();

    if (assetChartRecord.length === 0) {
      assetTimeLabels = [];
      assetReading = [];
    } else {
      assetChartRecord.reverse().forEach(data => {
        let count = 0;
        Object.keys(data.reading).forEach(key => {
          count++;
          switch (count) {
            case 1:
              first_dataset.push(data.reading[key]);
              d1 = {
                data: first_dataset,
                label: key
              };
              break;
            case 2:
              second_dataset.push(data.reading[key]);
              d2 = {
                data: second_dataset,
                label: key
              };
              break;
            case 3:
              third_dataset.push(data.reading[key]);
              d3 = {
                data: third_dataset,
                label: key
              };
              break;
            default:
              break;
          }
        });
        assetTimeLabels.push(datePipe.transform(data.timestamp, 'HH:mm:ss'));
      });
      assetReading.push(d1);
      assetReading.push(d2);
      assetReading.push(d3);
      // remove undefined dataset from the array
      assetReading = assetReading.filter(function (n) { return n !== undefined; });
    }
    this.statsAssetReadingsGraph(assetTimeLabels, assetReading);
  }

  statsAssetReadingsGraph(labels, assetReading): void {
    let ds = [];
    if (assetReading.length === 3) {
      const d1 = assetReading[0].data;
      const d2 = assetReading[1].data;
      const d3 = assetReading[2].data;
      ds = [{
        label: assetReading[0].label,
        data: d1,
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        backgroundColor: '#3498DB',
        borderColor: '#85C1E9'
      },
      {
        label: assetReading[1].label,
        data: d2,
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        backgroundColor: '#239B56',
        borderColor: '#82E0AA',
      },
      {
        label: assetReading[2].label,
        data: d3,
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        backgroundColor: '#B03A2E',
        borderColor: '#F1948A',
      }];
    } else if (assetReading.length === 2) {
      const d1 = assetReading[0].data;
      const d2 = assetReading[1].data;
      ds = [{
        label: assetReading[0].label,
        data: d1,
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        backgroundColor: '#3498DB',
        borderColor: '#85C1E9'
      },
      {
        label: assetReading[1].label,
        data: d2,
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        backgroundColor: '#239B56',
        borderColor: '#82E0AA',
      }];
    } else if (assetReading.length === 1) {
      ds = [{
        label: assetReading[0].label,
        data: assetReading[0].data,
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        backgroundColor: '#239B56',
        borderColor: '#82E0AA',
      }];
    } else {
      ds = [{
        label: [],
        data: [],
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        backgroundColor: '#239B56',
        borderColor: '#82E0AA',
      }];
    }
    this.assetChart = 'line';
    this.setAssetReadingValues(labels, ds);
  }

  setAssetReadingValues(labels, ds) {
    this.assetReadingValues = {
      labels: labels,
      datasets: ds
    };
  }

  clearField(limitField) {
    limitField.inputValue = '';
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
      .subscribe(() => this.plotReadingsGraph(this.assetCode, this.limit));
  }
}
