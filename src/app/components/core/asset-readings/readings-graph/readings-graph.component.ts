import { Component } from '@angular/core';
import { AnonymousSubscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Rx';

import { MomentDatePipe } from '../../../../pipes/moment-date';

import { AssetsService, PingService } from '../../../../services';
import { AssetSummaryService } from './../asset-summary/asset-summary-service';

import ReadingsValidator from '../assets/readings-validator';
import { MAX_INT_SIZE, POLLING_INTERVAL } from '../../../../utils';


@Component({
  selector: 'app-readings-graph',
  templateUrl: './readings-graph.component.html',
  styleUrls: ['./readings-graph.component.css']
})
export class ReadingsGraphComponent implements OnInit {
  public assetCode: string;
  public assetChartType: string;
  public assetReadingValues: any;
  public showGraph = true;
  public assetReadingSummary = [];
  public isInvalidLimit = false;
  public MAX_RANGE = MAX_INT_SIZE;
  public DEFAULT_LIMIT = 100;
  public graphRefreshInterval = POLLING_INTERVAL;
  private graphTimerSubscription: AnonymousSubscription;
  public limit: number;

  constructor(private assetService: AssetsService,
    private assetSummaryService: AssetSummaryService,
    private ping: PingService) {
    this.assetChartType = 'line';
    this.assetReadingValues = [];
  }

  public roundTo(num, to) {
    const _to = Math.pow(10, to);
    return Math.round(num * _to) / _to;
  }

  public toggleModal(shouldOpen: Boolean) {
    const chart_modal = <HTMLDivElement>document.getElementById('chart_modal');
    if (shouldOpen) {
      this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
        this.graphRefreshInterval = timeInterval;
      });
      chart_modal.classList.add('is-active');
      return;
    }
    if (this.graphTimerSubscription) {
      this.graphTimerSubscription.unsubscribe();
      this.graphTimerSubscription = null;
    }
    chart_modal.classList.remove('is-active');
  }

  public plotReadingsGraph(assetCode, limit: any) {
    if (this.assetCode === '') {
      return false;
    }
    if (this.graphTimerSubscription) {
      this.graphTimerSubscription.unsubscribe();
      this.graphTimerSubscription = null;
    }

    this.isInvalidLimit = false;
    if (limit === undefined || limit === null || limit === '' || limit === 0) {
      limit = this.DEFAULT_LIMIT;
    } else if (!Number.isInteger(+limit) || +limit < 0 || +limit > this.MAX_RANGE) { // max limit of int in c++
      this.isInvalidLimit = true;
      return;
    }

    this.limit = limit;
    this.assetCode = assetCode;

    this.assetService.getAssetReadings(encodeURIComponent(assetCode), +limit).
      subscribe(
        (data: any[]) => {
          this.showGraph = true;
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
              });
            this.getAssetTimeReading(data);
          } else {
            this.showGraph = false;
          }
          this.refreshGraphData();
        },
        error => {
          console.log('error in response', error);
        });
  }

  public getAssetTimeReading(assetChartRecord) {
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

  private statsAssetReadingsGraph(labels, assetReading): void {
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

  private setAssetReadingValues(labels, ds) {
    this.assetReadingValues = {
      labels: labels,
      datasets: ds
    };
  }

  private clearField(limitField) {
    limitField.inputValue = '';
  }

  private refreshGraphData(): void {
    this.graphTimerSubscription = Observable.timer(this.graphRefreshInterval)
      .subscribe(() => this.plotReadingsGraph(this.assetCode, this.limit));
  }
}
