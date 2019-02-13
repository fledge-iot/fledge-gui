import { Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { orderBy, chain, keys, map } from 'lodash';
import { interval } from 'rxjs';
import { Chart } from 'chart.js';

import { DateFormatterPipe } from '../../../../pipes/date-formatter-pipe';
import { AlertService, AssetsService, PingService } from '../../../../services';
import { ASSET_READINGS_TIME_FILTER, COLOR_CODES, MAX_INT_SIZE, POLLING_INTERVAL } from '../../../../utils';

@Component({
  selector: 'app-readings-graph',
  templateUrl: './readings-graph.component.html',
  styleUrls: ['./readings-graph.component.css']
})
export class ReadingsGraphComponent implements OnDestroy {
  public assetCode: string;
  public assetChartType: string;
  public assetReadingValues: any;
  public assetChartOptions: any;
  public showGraph = true;
  public assetReadingSummary = [];
  public isInvalidLimit = false;
  public MAX_RANGE = MAX_INT_SIZE;
  public graphRefreshInterval = POLLING_INTERVAL;

  public limit: number;
  public DEFAULT_LIMIT = 100;
  public optedTime = ASSET_READINGS_TIME_FILTER;
  public readKeyColorLabel = [];
  private isAlive: boolean;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('assetChart') assetChart: Chart;

  public excludedReadingsList = [];
  public assetReading = [];

  constructor(private assetService: AssetsService, private alertService: AlertService,
    private ping: PingService) {
    this.assetChartType = 'line';
    this.assetReadingValues = [];
    this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
      if (timeInterval === -1) {
        this.isAlive = false;
      }
      this.graphRefreshInterval = timeInterval;
    });
  }

  public roundTo(num, to) {
    const _to = Math.pow(10, to);
    return Math.round(num * _to) / _to;
  }

  public toggleModal(shouldOpen: Boolean) {
    const chart_modal = <HTMLDivElement>document.getElementById('chart_modal');
    if (shouldOpen) {
      chart_modal.classList.add('is-active');
      return;
    }
    if (this.graphRefreshInterval === -1) {
      this.notify.emit(false);
    } else {
      this.notify.emit(true);
    }
    this.isAlive = false;
    // reset showGraph variable to default state
    this.showGraph = true;
    chart_modal.classList.remove('is-active');
    sessionStorage.removeItem(this.assetCode);
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
    this.notify.emit(false);
    if (this.graphRefreshInterval === -1) {
      this.isAlive = false;
    } else {
      this.isAlive = true;
    }
    this.assetCode = assetCode;
    if (this.optedTime !== 0) {
      this.limit = 0;
      this.plotReadingsGraph(assetCode, this.limit, this.optedTime);
      this.showAssetReadingsSummary(assetCode, this.limit, this.optedTime);
    }
    interval(this.graphRefreshInterval)
      .takeWhile(() => this.isAlive) // only fires when component is alive
      .subscribe(() => {
        this.showAssetReadingsSummary(this.assetCode, this.limit, this.optedTime);
        this.plotReadingsGraph(this.assetCode, this.limit, this.optedTime);
      });
  }

  public getLimitBasedAssetReadingsAndSummary(limit: number = 0) {
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
          if (isNaN(o[k]['max']) || isNaN(o[k]['min'])) {
            return;
          }
          return {
            name: k,
            value: [o[k]]
          };
        }).filter(value => value !== undefined);
        this.assetReadingSummary = orderBy(this.assetReadingSummary, ['name'], ['asc']);
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
    this.isInvalidLimit = false;
    if (limit === undefined || limit === null || limit === '' || limit === 0) {
      limit = 0;
    } else if (!Number.isInteger(+limit) || +limit < 0 || +limit > this.MAX_RANGE) { // max limit of int in c++
      this.isInvalidLimit = true;
      return;
    }

    this.limit = limit;
    this.assetService.getAssetReadings(encodeURIComponent(assetCode), +limit, 0, time).
      subscribe(
        (data: any[]) => {
          this.statsAssetReadingsGraph(data);
        },
        error => {
          console.log('error in response', error);
        });
  }


  getColorCode(readKey, cnt, fill) {
    let cc = '';
    if (!['RED', 'GREEN', 'BLUE', 'R', 'G', 'B'].includes(readKey.toUpperCase())) {
      if (cnt >= 16) { // 15 is length of Utils' colorCodes array
        cc = '#ad7ebf';
      } else {
        cc = COLOR_CODES[cnt];
      }
    }
    if (readKey.toUpperCase() === 'RED' || readKey.toUpperCase() === 'R') {
      cc = '#FF334C';
    } else if (readKey.toUpperCase() === 'BLUE' || readKey.toUpperCase() === 'B') {
      cc = '#339FFF';
    } else if (readKey.toUpperCase() === 'GREEN' || readKey.toUpperCase() === 'G') {
      cc = '#008000';
    }

    if (fill) {
      this.readKeyColorLabel.push({ [readKey]: cc });
    }
    return cc;
  }

  private statsAssetReadingsGraph(data: any): void {
    this.showGraph = true;
    this.assetReading = [];
    this.excludedReadingsList = [];
    const datePipe = new DateFormatterPipe();
    const timestamps = data.map((t: any) => datePipe.transform(t.timestamp, 'HH:mm:ss:SSS'));
    const readings = data.map((r: any) => r.reading);
    const uniqueKeys = chain(readings).map(keys).flatten().uniq().value();
    for (const k of uniqueKeys) {
      let assetReads = map(readings, k);
      assetReads = assetReads.filter(function( el ) {
        return el !== undefined;
      });
      if (!assetReads.some(isNaN)) {
        const read = {
          key: k,
          values: assetReads
        };
        this.assetReading.push(read);
      } else {
        this.excludedReadingsList.push(k);
      }
    }

    if (this.assetReading.length === 0 && this.excludedReadingsList.length >= 1) {
      this.showGraph = false;
      return;
    }
    this.readKeyColorLabel = [];
    const ds = [];
    let count = 0;
    this.assetReading.forEach(element => {
      const dt = {
        label: element.key,
        data: element.values,
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        hidden: this.getLegendState(element.key),
        backgroundColor: this.getColorCode(element.key.trim(), count, true),
        borderColor: this.getColorCode(element.key, count, false)
      };
      count++;
      ds.push(dt);
    });
    this.setAssetReadingValues(timestamps, ds);
  }

  public getLegendState(key) {
    const selectedLegends = JSON.parse(sessionStorage.getItem(this.assetCode));
    if (selectedLegends == null) {
      return false;
    }
    for (const l of selectedLegends) {
      if (l.key === key && l.selected === true) {
        return true;
      }
    }
  }

  private setAssetReadingValues(labels, ds) {
    this.assetReadingValues = {
      labels: labels,
      datasets: ds
    };
    this.assetChartType = 'line';
    this.assetChartOptions = {
      scales: {
        xAxes: [{
          type: 'time',
          time: {
            parser: 'HH:mm:ss',
            unit: 'second',
            displayFormats: {
              unit: 'second',
              second: 'HH:mm:ss'
            }
          },
          ticks: {
            source: labels,
            autoSkip: true
          },
          bounds: 'ticks'
        }]
      },
      legend: {
        onClick: (e, legendItem) => {
          console.log('clicked ', legendItem, e);
          const index = legendItem.datasetIndex;
          const chart = this.assetChart.chart;
          const meta = chart.getDatasetMeta(index);
          /**
          * meta data have hidden property as null by default in chart.js
          */
          meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
          let savedLegendState = JSON.parse(sessionStorage.getItem(this.assetCode));
          if (savedLegendState !== null) {
            if (legendItem.hidden === false) {
              savedLegendState.push({ key: legendItem.text, selected: true });
            } else {
              savedLegendState = savedLegendState.filter(dt => dt.key !== legendItem.text);
            }
          } else {
            savedLegendState = [{ key: legendItem.text, selected: true }];
          }
          sessionStorage.setItem(this.assetCode, JSON.stringify(savedLegendState));
          chart.update();
        }
      }
    };
  }

  public isNumber(val) {
    return typeof val === 'number';
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
  }
}

