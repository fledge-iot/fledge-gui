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
  public summaryLimit = 5;
  public buttonText = '';
  public autoRefresh = false;
  public showGraphSpinner = true;
  public showSummarySpinner = true;
  public isSpectrum = false;
  public polyGraphData = {};
  public showSummary = false;
  public timeDropDownOpened = false;
  public SHOW_SUMMARY_TEXT = 'Show Summary';
  public SHOW_GRAPH_TEXT = 'Show Graph';
  public toggleSummaryGraphButtonText = this.SHOW_SUMMARY_TEXT;

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('assetChart') assetChart: Chart;

  public excludedReadingsList = [];
  public excludedReadingsSummaryList = [];

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

  public showAll() {
    this.autoRefresh = false;
    if (this.buttonText === 'Show Less') {
      this.summaryLimit = 5;
      this.buttonText = 'Show All';
    } else {
      this.summaryLimit = this.assetReadingSummary.length;
      this.buttonText = 'Show Less';
    }
  }

  public roundTo(num, to) {
    const _to = Math.pow(10, to);
    return Math.round(num * _to) / _to;
  }

  public toggleModal(shouldOpen: Boolean) {
    // reset all variable and array to default state
    this.showGraph = true;
    this.assetReadingSummary = [];
    this.buttonText = '';
    this.assetReadingValues = [];
    this.summaryLimit = 5;
    this.readKeyColorLabel = [];
    this.showGraphSpinner = true;
    this.showSummarySpinner = true;
    this.excludedReadingsList = [];
    this.excludedReadingsSummaryList = [];
    this.assetChartOptions = {};
    this.showSummary = false;
    this.toggleSummaryGraphButtonText = this.SHOW_SUMMARY_TEXT;

    sessionStorage.removeItem(this.assetCode);

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
    chart_modal.classList.remove('is-active');
    const activeDropDowns = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDowns.length > 0) {
      activeDropDowns[0].classList.remove('is-active');
    }
    this.optedTime = ASSET_READINGS_TIME_FILTER;
  }

  getTimeBasedAssetReadingsAndSummary(time) {
    this.optedTime = time;
    if (this.optedTime === 0) {
      if (this.showSummary) {
        this.showAssetReadingsSummary(this.assetCode, this.DEFAULT_LIMIT, this.optedTime);
      } else {
        this.plotReadingsGraph(this.assetCode, this.DEFAULT_LIMIT, this.optedTime);
      }
    } else {
      this.limit = 0;
      if (this.showSummary) {
        this.showAssetReadingsSummary(this.assetCode, this.limit, time);
      } else {
        this.plotReadingsGraph(this.assetCode, this.limit, this.optedTime);
      }
    }
    this.toggleDropdown();
  }

  toggleSummaryGraph(state: boolean) {
    this.showSummary = !state;
    if (state) {
      this.excludedReadingsSummaryList = [];
      this.toggleSummaryGraphButtonText = this.SHOW_SUMMARY_TEXT;
      this.plotReadingsGraph(this.assetCode, this.limit, this.optedTime);
    } else {
      this.excludedReadingsList = [];
      this.toggleSummaryGraphButtonText = this.SHOW_GRAPH_TEXT;
      this.showAssetReadingsSummary(this.assetCode, this.limit, this.optedTime);
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
      this.autoRefresh = false;
      if (this.showSummary) {
        this.showAssetReadingsSummary(assetCode, this.limit, this.optedTime);
      } else {
        this.plotReadingsGraph(assetCode, this.limit, this.optedTime);
      }
    }
    interval(this.graphRefreshInterval)
      .takeWhile(() => this.isAlive) // only fires when component is alive
      .subscribe(() => {
        this.autoRefresh = true;
        if (this.showSummary) {
          this.showAssetReadingsSummary(this.assetCode, this.limit, this.optedTime);
        } else {
          this.plotReadingsGraph(this.assetCode, this.limit, this.optedTime);
        }
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
    if (!this.showSummary) {
      this.showAssetReadingsSummary(this.assetCode, this.limit, this.optedTime);
    } else {
      this.plotReadingsGraph(this.assetCode, this.limit, this.optedTime);
    }
  }

  public showAssetReadingsSummary(assetCode, limit: number = 0, time: number = 0) {
    if (this.isSpectrum) {
      this.showSummarySpinner = false;
      return;
    }
    this.assetService.getAllAssetSummary(assetCode, limit, time).subscribe(
      (data: any) => {
        this.assetReadingSummary = data.map(o => {
          const k = Object.keys(o)[0];
          if (isNaN(o[k]['max']) || isNaN(o[k]['min'])) {
            if (!this.excludedReadingsSummaryList.includes(k)) {
              this.excludedReadingsSummaryList.push(k);
            }
          } else {
            return {
              name: k,
              value: [o[k]]
            };
          }
        }).filter(value => value !== undefined);
        this.showSummarySpinner = false;
        if (this.assetReadingSummary.length === 0 && this.excludedReadingsSummaryList.length >= 1) {
          this.showGraph = false;
        } else {
          this.assetReadingSummary = orderBy(this.assetReadingSummary, ['name'], ['asc']);
          if (this.assetReadingSummary.length > 5 && this.summaryLimit === 5) {
            this.buttonText = 'Show All';
          }
          if (this.assetReadingSummary.length <= 5) {
            this.buttonText = '';
          }
          if (this.assetReadingSummary.length > 5 && this.summaryLimit > 5) {
            this.buttonText = 'Show Less';
          }
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
          this.showGraphSpinner = false;
        },
        error => {
          console.log('error in response', error);
        });
  }

  getColorCode(readKey, cnt, fill) {
    let cc = '';
    if (!['RED', 'GREEN', 'BLUE', 'R', 'G', 'B'].includes(readKey.toUpperCase())) {
      if (cnt >= 51) { // 50 is length of Utils' colorCodes array
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
    this.isSpectrum = false;
    this.showGraph = true;
    this.excludedReadingsList = [];
    const datePipe = new DateFormatterPipe();
    const timestamps = data.map((t: any) => datePipe.transform(t.timestamp, 'HH:mm:ss:SSS'));
    const readings = data.map((r: any) => r.reading);
    const uniqueKeys = chain(readings).map(keys).flatten().uniq().value();
    const dataset = [];
    this.readKeyColorLabel = [];
    let count = 0;
    for (const k of uniqueKeys) {
      if (k.toLowerCase() === 'spectrum') {
        this.createFFTGraph(k, readings, timestamps);
        return;
      }
      this.isSpectrum = false;
      const reads = [];
      const dt = {
        label: k,
        data: [],
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        hidden: this.getLegendState(k),
        backgroundColor: this.getColorCode(k.trim(), count, true),
        borderColor: this.getColorCode(k.trim(), count, false)
      };
      for (const r of data) {
        reads.push({
          x: datePipe.transform(r.timestamp, 'HH:mm:ss:SSS'),
          y: r.reading[k]
        });
      }
      dt.data = reads.filter(r => r.y !== undefined)
        .filter(r => {
          if (!isNaN(r.y)) {
            return r;
          } else {
            if (!this.excludedReadingsList.includes(k)) {
              this.excludedReadingsList.push(k);
            }
          }
        });
      if (dt.data.length) {
        dataset.push(dt);
      }
      count++;
    }
    if (dataset.length === 0 && this.excludedReadingsList.length >= 1) {
      this.showGraph = false;
    } else {
      this.setAssetReadingValues(dataset, timestamps);
    }
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

  private setAssetReadingValues(ds: any, timestamps: any) {
    this.assetReadingValues = {
      labels: timestamps,
      datasets: ds
    };
    this.assetChartType = 'line';
    this.assetChartOptions = {
      elements: {
        point: { radius: 0 }
      },
      scales: {
        xAxes: [{
          type: 'time',
          distribution: 'linear',
          time: {
            parser: 'HH:mm:ss',
            unit: 'second',
            displayFormats: {
              unit: 'second',
              second: 'HH:mm:ss'

            }
          },
          ticks: {
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

  public toggleDropdown() {
    const dropDown = document.querySelector('#time-dropdown');
    dropDown.classList.toggle('is-active');
    if (!dropDown.classList.contains('is-active')) {
      this.timeDropDownOpened = false;
    } else {
      this.timeDropDownOpened = true;
    }
  }

  createFFTGraph(key: string, readings: [], timestamps: []) {
    const assetReads = map(readings, key).filter(el => el !== undefined);
    this.polyGraphData = {
      data: [
        {
          type: 'surface',
          y: timestamps,
          z: assetReads,
          showscale: false,
          colorscale: [
            ['0', 'rgba(68,1,84,1)'],
            ['0.1', 'rgba(61,77,137,1)'],
            ['0.2', 'rgba(57,89,140,1)'],
            ['0.3', 'rgba(49,104,142,1)'],
            ['0.4', 'rgba(44,119,142,1)'],
            ['0.5', 'rgba(38,136,141,1)'],
            ['0.6', 'rgba(33,154,138,1)'],
            ['0.7', 'rgba(50,178,124,1)'],
            ['0.8', 'rgba(101,201,96,1)'],
            ['0.9', 'rgba(101,201,96,1)'],
            ['1', 'rgba(253,231,37,1)']],
          colorbar: {
            tick0: 0,
            dtick: 5
          }
        },
      ],
      layout: {
        title: 'FFT spectrum',
        showlegend: true,
        autoSize: true,
        margin: {
          b: 40,
          l: 60,
          r: 10,
          t: 25
        }
      }
    };
    this.isSpectrum = true;
  }

  public isNumber(val) {
    return typeof val === 'number';
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
  }
}

