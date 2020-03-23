import { Component, EventEmitter, OnDestroy, HostListener, Output, ViewChild, ElementRef } from '@angular/core';
import { orderBy, chain, map, groupBy, mapValues, omit, isEmpty } from 'lodash';
import { interval, Subject } from 'rxjs';
import { takeWhile, takeUntil } from 'rxjs/operators';

import { Chart } from 'chart.js';
import { AlertService, AssetsService, PingService } from '../../../../services';
import { ASSET_READINGS_TIME_FILTER, COLOR_CODES, MAX_INT_SIZE, POLLING_INTERVAL } from '../../../../utils';
import { KeyValue } from '@angular/common';
import { DateFormatterPipe } from '../../../../pipes';

declare var Plotly: any;

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
  public loadPage = true;
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
  public showSpinner = false;
  public polyGraphData: any;
  public timeDropDownOpened = false;
  public isModalOpened = false;

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('assetChart', { static: false }) assetChart: Chart;
  @ViewChild('3DGraph', { static: false }) Graph: ElementRef;
  @ViewChild('FFT2DGraph', { static: false }) FFT2DGraph: ElementRef;

  public fft2DReadings = [];
  public numberTypeReadingsList = [];
  public stringTypeReadingsList: any;
  public arrayTypeReadingsList = [];
  public selectedTab = 1;
  public timestamps = [];

  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private assetService: AssetsService, private alertService: AlertService,
    private ping: PingService, private dateFormatter: DateFormatterPipe) {
    this.assetChartType = 'line';
    this.assetReadingValues = [];
    this.ping.pingIntervalChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((timeInterval: number) => {
        if (timeInterval === -1) {
          this.isAlive = false;
        }
        this.graphRefreshInterval = timeInterval;
      });
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.loadPage = false;
    this.toggleModal(false);
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
    this.assetReadingSummary = [];
    this.buttonText = '';
    this.assetReadingValues = [];
    this.summaryLimit = 5;
    this.readKeyColorLabel = [];
    this.assetChartOptions = {};
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
    this.showAssetReadingsSummary(this.assetCode, this.limit, this.optedTime);
    this.plotReadingsGraph(this.assetCode, this.limit, this.optedTime);
    this.toggleDropdown();
  }

  public getAssetCode(assetCode: string) {
    this.isModalOpened = true;
    this.selectedTab = 1;
    this.loadPage = true;
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
      this.plotReadingsGraph(assetCode, this.limit, this.optedTime);
    }
    interval(this.graphRefreshInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        this.autoRefresh = true;
        if (this.selectedTab === 5) {
          this.showAssetReadingsSummary(this.assetCode, this.limit, this.optedTime);
        } else {
          this.plotReadingsGraph(this.assetCode, this.limit, this.optedTime);
        }
      });
  }

  public showAssetReadingsSummary(assetCode, limit: number = 0, time: number = 0) {
    this.assetService.getAllAssetSummary(assetCode, limit, time)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any) => {
          this.showSpinner = false;
          this.assetReadingSummary = data
            .map(o => {
              const k = Object.keys(o)[0];
              return {
                name: k,
                value: [o[k]]
              };
            }).filter(value => value !== undefined);

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
    this.assetService.getAssetReadings(encodeURIComponent(assetCode), +limit, 0, time)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any[]) => {
          this.loadPage = false;
          this.getReadings(data);
        },
        error => {
          console.log('error in response', error);
        });
  }

  getReadings(readings: any) {
    const numReadings = [];
    const strReadings = [];
    const arrReadings = [];

    this.timestamps = readings.map((r: any) => r.timestamp);
    for (const r of readings) {
      Object.entries(r.reading).forEach(([k, value]) => {
        if (typeof value === 'number') {
          numReadings.push({
            key: k,
            read: { x: r.timestamp, y: value }
          });
        }
        if (typeof value === 'string') {
          strReadings.push({
            key: k,
            timestamp: r.timestamp,
            data: value
          });
        }
        if (Array.isArray(value) && k === 'spectrum') {
          const spectrumFrequency = value.map((read, index) => {
            {
              if (r.reading.spectrum_freq_scale !== undefined) {
                return read * r.reading.spectrum_freq_scale
                  + r.reading.spectrum_min_freq
                  + r.reading.spectrum_freq_scale / 2
                  + (index) * r.reading.spectrum_freq_scale;
              }
            }
          }).filter(f => f !== undefined);

          arrReadings.push({
            key: k,
            read: value,
            freq: spectrumFrequency
          });
        }
      });
    }
    this.numberTypeReadingsList = numReadings.length > 0 ? this.mergeObjects(numReadings) : [];
    this.stringTypeReadingsList = strReadings;
    this.arrayTypeReadingsList = arrReadings.length > 0 ? this.mergeObjects(arrReadings) : [];
    this.fft2DReadings = this.arrayTypeReadingsList.length > 0 && !isEmpty(arrReadings[0].freq)
      && arrReadings[0].key === 'spectrum' ? [arrReadings[0]] : [];

    this.stringTypeReadingsList = mapValues(groupBy(this.stringTypeReadingsList,
      (reading) => this.dateFormatter.transform(reading.timestamp, 'HH:mm:ss:SSS')), rlist => rlist.map(read => omit(read, 'timestamp')));
    this.setTabData();
  }

  setTabData() {
    if (this.isModalOpened) {
      if (this.numberTypeReadingsList.length > 0) {
        this.selectedTab = 1;
      } else if (this.arrayTypeReadingsList.length > 0) {
        this.selectedTab = 2;
      } else if (!this.isEmptyObject(this.stringTypeReadingsList)) {
        this.selectedTab = 3;
      } else if (this.fft2DReadings.length > 0) {
        this.selectedTab = 4;
      }
      this.isModalOpened = false;
    }

    if (this.selectedTab === 1 && this.numberTypeReadingsList.length === 0) {
      if (this.arrayTypeReadingsList.length > 0) {
        this.selectedTab = 2;
      } else if (!this.isEmptyObject(this.stringTypeReadingsList)) {
        this.selectedTab = 3;
      }
    }

    if (this.selectedTab === 2 && this.arrayTypeReadingsList.length === 0) {
      if (this.numberTypeReadingsList.length > 0) {
        this.selectedTab = 1;
      } else if (!this.isEmptyObject(this.stringTypeReadingsList)) {
        this.selectedTab = 3;
      }
    }

    if (this.selectedTab === 3 && this.isEmptyObject(this.stringTypeReadingsList)) {
      if (this.numberTypeReadingsList.length > 0) {
        this.selectedTab = 1;
      } else if (this.arrayTypeReadingsList.length > 0) {
        this.selectedTab = 2;
      }
    }

    if (this.selectedTab === 5 && this.numberTypeReadingsList.length === 0) {
      if (this.arrayTypeReadingsList.length > 0) {
        this.selectedTab = 2;
      } else if (!this.isEmptyObject(this.stringTypeReadingsList)) {
        this.selectedTab = 3;
      }
    }

    if (this.selectedTab === 1 && this.numberTypeReadingsList.length > 0) {
      this.statsAssetReadingsGraph(this.numberTypeReadingsList, this.timestamps);
    } else if (this.selectedTab === 2 && this.arrayTypeReadingsList.length > 0) {
      this.create3DGraph(this.arrayTypeReadingsList, this.timestamps);
    } else if (this.selectedTab === 4 && this.fft2DReadings.length > 0) {
      this.createFFT2DGraph(this.fft2DReadings);
    }

    this.showSpinner = false;
  }

  mergeObjects(assetReadings: any) {
    return chain(assetReadings).groupBy('key').map(function (group, key) {
      return {
        key: key,
        read: map(group, 'read'),
        freq: map(group, 'freq')
      };
    }).value();
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

  private statsAssetReadingsGraph(assetReadings: any, timestamps: any): void {
    const dataset = [];
    this.readKeyColorLabel = [];
    let count = 0;
    for (const r of assetReadings) {
      const dt = {
        label: r.key,
        data: r.read,
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        hidden: this.getLegendState(r.key),
        backgroundColor: this.getColorCode(r.key.trim(), count, true),
        borderColor: this.getColorCode(r.key.trim(), count, false)
      };
      if (dt.data.length) {
        dataset.push(dt);
      }
      count++;
    }
    this.setAssetReadingValues(dataset, timestamps);
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

  private setAssetReadingValues(ds: any, timestamps) {
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
            unit: 'second',
            tooltipFormat: 'HH:mm:ss:SSS',
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


  createFFT2DGraph(readings: any) {
    const frequency = readings.map(r => r.freq)[0];
    const amplitude = readings.map(r => r.read)[0];
    const data = {
      data: [
        {
          type: 'scatter',
          mode: 'lines',
          x: frequency,
          y: amplitude,
        },
      ],
      layout: {
        title: {
          text: this.assetCode,
          font: {
            size: 16,
            color: '#7f7f7f'
          },
          xref: 'paper'
        },
        showlegend: false,
        autoSize: true,
        xaxis: {
          automargin: true,
          title: {
            text: 'Freq(Hz)',
            font: {
              size: 12,
              color: '#7f7f7f'
            },
            xref: 'paper'
          }
        },
        yaxis: {
          automargin: true,
          title: {
            text: 'Amplitude',
            font: {
              size: 12,
              color: '#7f7f7f'
            },
            xref: 'paper'
          }
        },
        margin: {
          b: 10,
          l: 10,
          r: 10,
          t: 25
        }
      },
      frames: [],
      config: {
        displayModeBar: false
      }
    };

    const intervalId = setInterval(() => {
      if (this.FFT2DGraph) {
        Plotly.newPlot(
          this.FFT2DGraph.nativeElement,
          data);
        clearInterval(intervalId);
      }
    }, 100);
  }

  create3DGraph(readings: any, ts: any) {
    const timestamps = ts.map((t: any) => this.dateFormatter.transform(t, 'HH:mm:ss'));
    const frequency = readings.map(r => r.freq)[0];
    const amplitude = readings.map(r => r.read)[0];
    const frequencyAvailable = !isEmpty(frequency[0]);
    this.polyGraphData = {
      data: [
        {
          type: 'surface',
          ...frequencyAvailable && { x: frequency },
          y: timestamps,
          z: amplitude,
          showscale: false,
          colorscale: 'Rainbow'
        },
      ],
      layout: {
        title: {
          text: this.assetCode,
          font: {
            size: 16,
            color: '#7f7f7f'
          },
          xref: 'paper'
        },
        showlegend: true,
        autoSize: true,
        scene: {
          xaxis: {
            autorange: 'reversed',
            automargin: true,
            title: {
              text: 'Freq(Hz)',
              font: {
                size: 10,
                color: '#7f7f7f'
              },
              xref: 'paper'
            }
          },
          yaxis: {
            autorange: 'reversed',
            automargin: true,
            title: {
              text: 'Time',
              font: {
                size: 10,
                color: '#7f7f7f'
              },
              xref: 'paper'
            }
          },
          zaxis: {
            automargin: true,
            title: {
              text: 'Amplitude',
              font: {
                size: 10,
                color: '#7f7f7f'
              },
              xref: 'paper'
            }
          },
          camera: {
            eye: {
              x: 1,
              y: 2,
              z: 0.1
            }
          }
        },
        margin: {
          b: 10,
          l: 10,
          r: 10,
          t: 25
        }
      },
      config: {
        displayModeBar: false
      }
    };

    if (this.Graph === undefined) {
      this.generate3Dgraph();
    } else {
      const update = {
        ...frequencyAvailable && { x: [frequency] },
        y: [timestamps],
        z: [amplitude],
      };
      Plotly.update(this.Graph.nativeElement, update);
    }
  }

  public async generate3Dgraph() {
    // Initilization of DOM element to render graph
    // takes time at fist so need some time to wait here.
    const intervalId = setInterval(() => {
      if (this.Graph) {
        Plotly.newPlot(
          this.Graph.nativeElement,
          this.polyGraphData);
        clearInterval(intervalId);
      }
    }, 100);
  }

  public isNumber(val) {
    return typeof val === 'number';
  }

  selectTab(id: number, showSpinner = true) {
    this.showSpinner = showSpinner;
    this.selectedTab = id;
    if (this.graphRefreshInterval === -1 && this.selectedTab === 5) {
      this.showAssetReadingsSummary(this.assetCode, this.limit, this.optedTime);
    } else if (this.graphRefreshInterval === -1) {
      this.plotReadingsGraph(this.assetCode, this.limit, this.optedTime);
    }
  }

  showSummaryTab() {
    return this.numberTypeReadingsList.length > 0;
  }

  isEmptyObject(obj) {
    return (obj && (Object.keys(obj).length === 0));
  }

  keyDescOrder = (a: KeyValue<number, string>, b: KeyValue<number, string>): number => {
    return a.key > b.key ? -1 : (b.key > a.key ? 1 : 0);
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }
}
