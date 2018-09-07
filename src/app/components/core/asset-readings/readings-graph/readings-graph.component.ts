import { Component } from '@angular/core';
import { orderBy } from 'lodash';
import { Observable } from 'rxjs/Rx';
import { AnonymousSubscription } from 'rxjs/Subscription';

import { DateFormatterPipe } from '../../../../pipes/date-formatter-pipe';
import { AlertService, AssetsService, PingService } from '../../../../services';
import { ASSET_READINGS_TIME_FILTER, COLOR_CODES, MAX_INT_SIZE, POLLING_INTERVAL } from '../../../../utils';
import ReadingsValidator from '../assets/readings-validator';

@Component({
  selector: 'app-readings-graph',
  templateUrl: './readings-graph.component.html',
  styleUrls: ['./readings-graph.component.css']
})
export class ReadingsGraphComponent {
  public assetCode: string;
  public assetChartType: string;
  public assetReadingValues: any;
  public showGraph = true;
  public assetReadingSummary = [];
  public isInvalidLimit = false;
  public MAX_RANGE = MAX_INT_SIZE;
  public graphRefreshInterval = POLLING_INTERVAL;
  private graphTimerSubscription: AnonymousSubscription;
  public limit: number;
  public DEFAULT_LIMIT = 100;
  public optedTime = ASSET_READINGS_TIME_FILTER;
  public readKeyColorLabel = [];

  constructor(private assetService: AssetsService, private alertService: AlertService,
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

  getTimeBasedAssetReadingsAndSummary(time) {
    this.optedTime = time;
    if (this.optedTime === 0) {
      this.showAssetReadingsSummary(this.assetCode, this.DEFAULT_LIMIT, this.optedTime);
      this.plotReadingsGraph(this.assetCode, this.DEFAULT_LIMIT, this.optedTime);
    } else {
      this.limit = 0;
      this.showAssetReadingsSummary(this.assetCode, this.limit, time);
      this.plotReadingsGraph(this.assetCode, this.limit, this.optedTime);
    }
  }

  public getAssetCode(assetCode) {
    this.assetCode = assetCode;
    if (this.optedTime !== 0) {
      this.limit = 0;
      this.plotReadingsGraph(assetCode, this.limit, this.optedTime);
      this.showAssetReadingsSummary(assetCode, this.limit, this.optedTime);
    }
  }

  public getLimitBasedAssetReadingsAndSummary(limit: number = 0) {
    console.log('limit', limit);
    if (limit == null) {
      this.optedTime = ASSET_READINGS_TIME_FILTER;
      this.limit = 0;
    } else {
      this.limit = limit;
      this.optedTime = 0;
    }
    this.showAssetReadingsSummary(this.assetCode, this.limit, this.optedTime);
    this.plotReadingsGraph(this.assetCode, this.limit, this.optedTime);
  }

  public showAssetReadingsSummary(assetCode, limit: number = 0, time: number = 0) {
    this.assetService.getAllAssetSummary(assetCode, limit, time).subscribe(
      (data: any) => {
        this.assetReadingSummary = data.map(o => {
          const k = Object.keys(o)[0];
          return {
            name: k,
            value: [o[k]]
          };
        });
        this.assetReadingSummary = orderBy(this.assetReadingSummary, ['name'], ['asc']);
        if (this.graphRefreshInterval > 0) {
          this.enableRefreshTimer();
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

  public plotReadingsGraph(assetCode, limit = null, time = null) {
    if (assetCode === '') {
      return false;
    }
    if (this.graphTimerSubscription) {
      this.graphTimerSubscription.unsubscribe();
      this.graphTimerSubscription = null;
    }

    this.isInvalidLimit = false;
    if (limit === undefined || limit === null || limit === '' || limit === 0) {
      limit = 0;
    } else if (!Number.isInteger(+limit) || +limit < 0 || +limit > this.MAX_RANGE) { // max limit of int in c++
      this.isInvalidLimit = true;
      return;
    }

    this.limit = limit;
    this.assetService.getAssetReadings(encodeURIComponent(assetCode), +limit, time).
      subscribe(
        (data: any[]) => {
          this.showGraph = true;
          if (data.length === 0) {
            this.getAssetTimeReading(data);
            return;
          }
          const validRecord = ReadingsValidator.validate(data);
          if (validRecord) {
            this.getAssetTimeReading(data);
          } else {
            this.showGraph = false;
          }
        },
        error => {
          console.log('error in response', error);
        });
  }

  public getAssetTimeReading(assetChartRecord) {
    let assetTimeLabels = [];
    const datePipe = new DateFormatterPipe();

    let assetReading = [];
    if (assetChartRecord.length === 0) {
      assetTimeLabels = [];
      assetReading = [];
    } else {
      assetChartRecord.reverse().forEach(data => {
        Object.keys(data.reading).forEach(key => {
          if (assetReading.length < Object.keys(data.reading).length) {
            const read = {
              key: key,
              values: [data.reading[key]],
            };
            assetReading.push(read);
          } else {
            assetReading.map(el => {
              if (el.key === key) {
                el.values.push(data.reading[key]);
              }
            });
          }
        });
        assetTimeLabels.push(datePipe.transform(data.timestamp, 'HH:mm:ss'));
      });
    }
    this.statsAssetReadingsGraph(assetTimeLabels, assetReading);
  }

  getColorCode(readKey, cnt, fill) {
    let cc = '';
    if (!['RED', 'GREEN', 'BLUE'].includes(readKey.toUpperCase())) {
      cc = COLOR_CODES[cnt];
    }
    if (readKey.toUpperCase() === 'RED') {
      cc = '#FF334C';
    } else if (readKey.toUpperCase() === 'BLUE') {
      cc = '#339FFF';
    } else if (readKey.toUpperCase() === 'GREEN') {
      cc = '#008000';
    }
    if (fill) {
      this.readKeyColorLabel.push({ [readKey]: cc });
    }
    return cc;
  }

  private statsAssetReadingsGraph(labels, assetReading): void {
    this.readKeyColorLabel = [];
    const ds = [];
    let count = 0;
    assetReading.forEach(element => {
      const dt = {
        label: element.key,
        data: element.values,
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        backgroundColor: this.getColorCode(element.key.trim(), count, true),
        borderColor: this.getColorCode(element.key, count, false)
      };
      count++;
      ds.push(dt);
    });
    this.assetChartType = 'line';
    this.setAssetReadingValues(labels, ds);
  }

  private setAssetReadingValues(labels, ds) {
    this.assetReadingValues = {
      labels: labels,
      datasets: ds
    };
  }

  /*
  public clearField(limitField) {
    limitField.inputValue = '';
    this.limit = 0;
    if (this.graphTimerSubscription) {
      this.graphTimerSubscription.unsubscribe();
      this.graphTimerSubscription = null;
    }
  }
*/

  private enableRefreshTimer(): void {
    this.graphTimerSubscription = Observable.timer(this.graphRefreshInterval)
      .subscribe(() => {
        this.showAssetReadingsSummary(this.assetCode, this.limit, this.optedTime);
        this.plotReadingsGraph(this.assetCode, this.limit, this.optedTime);
      });
  }
}
