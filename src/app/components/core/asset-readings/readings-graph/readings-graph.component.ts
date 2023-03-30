import { Component, EventEmitter, OnDestroy, HostListener, Output, ViewChild, ElementRef } from '@angular/core';
import { orderBy, chain, map, groupBy, mapValues, omit } from 'lodash';
import { interval, Subject, Subscription } from 'rxjs';
import { takeWhile, takeUntil } from 'rxjs/operators';

import { Chart } from 'chart.js';
import { AlertService, AssetsService, PingService, SharedService } from '../../../../services';
import Utils, { ASSET_READINGS_TIME_FILTER, CHART_COLORS, MAX_INT_SIZE, POLLING_INTERVAL } from '../../../../utils';
import { KeyValue } from '@angular/common';
import { DateFormatterPipe } from '../../../../pipes';
import { RangeSliderService } from '../../../common/range-slider/range-slider.service';

declare var Plotly: any;

@Component({
  selector: 'app-readings-graph',
  templateUrl: './readings-graph.component.html',
  styleUrls: ['./readings-graph.component.css']
})
export class ReadingsGraphComponent implements OnDestroy {
  @Output() refreshAssets = new EventEmitter<boolean>();
  public assetCode: string;
  public assetChartType: string;
  public assetReadingValues = {};
  public assetChartOptions: any;
  public loadPage = true;
  public assetReadingSummary = [];
  public isInvalidLimit = false;
  public MAX_RANGE = MAX_INT_SIZE;
  public graphRefreshInterval = POLLING_INTERVAL;

  public limit: number;
  public DEFAULT_LIMIT = 100;
  public optedTime = ASSET_READINGS_TIME_FILTER;
  public isAlive: boolean;
  public summaryLimit = 5;
  public buttonText = '';
  public autoRefresh = false;
  public showSpinner = false;
  public polyGraphData: any;
  public timeDropDownOpened = false;
  public isModalOpened = false;
  public availableAssets = [];
  public selectedAsset;
  public additionalAssets = [];

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('assetChart') assetChart: Chart;
  @ViewChild('3DGraph') Graph: ElementRef;

  public numberTypeReadingsList = [];
  public stringTypeReadingsList: any;
  public arrayTypeReadingsList = [];
  public imageReadings = [];
  public selectedTab = 1;
  public timestamps = [];
  public isLatestReadings = false;

  destroy$: Subject<boolean> = new Subject<boolean>();
  private subscription: Subscription;
  private latestReadingSubscription: Subscription;
  private assetsSubscription: Subscription;

  constructor(
    private assetService: AssetsService,
    private alertService: AlertService,
    private ping: PingService,
    private sharedService: SharedService,
    private dateFormatter: DateFormatterPipe,
    public rangeSliderService: RangeSliderService) {
      this.assetChartType = 'line';
      this.assetReadingValues = {};
      this.ping.pingIntervalChanged
        .pipe(takeUntil(this.destroy$))
        .subscribe((timeInterval: number) => {
          if (timeInterval === -1) {
            this.isAlive = false;
          }
          this.graphRefreshInterval = timeInterval;
        });
      this.assetsSubscription = this.sharedService.assets.subscribe(assets => {
        if (assets) {
          this.availableAssets = [];
          assets.forEach(asset => {
            this.availableAssets.push(asset.assetCode);
          });
          
          // remove selected graph asset from the dropdown list
          if (this.selectedAsset) {
            const index: number = this.availableAssets.indexOf(this.selectedAsset);
            if (index !== -1) {
                this.availableAssets.splice(index, 1);
            } 
          }       
        }
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
    this.additionalAssets = [];
    this.buttonText = '';
    this.assetReadingValues = {};
    this.summaryLimit = 5;
    this.assetChartOptions = {};
    sessionStorage.removeItem(this.assetCode);

    const chart_modal = <HTMLDivElement>document.getElementById('chart_modal');
    if (shouldOpen) {
      this.additionalAssets.push(this.assetCode);
      chart_modal.classList.add('is-active');
      return;
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.latestReadingSubscription) {
      this.latestReadingSubscription.unsubscribe();
    }
    if (this.assetsSubscription) {
      this.assetsSubscription.unsubscribe();
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
    let rGraphDefaultDuration = localStorage.getItem('READINGS_GRAPH_DEFAULT_DURATION');
    this.optedTime = rGraphDefaultDuration !== null ? parseInt(rGraphDefaultDuration) : ASSET_READINGS_TIME_FILTER;
  }

  getTimeBasedAssetReadingsAndSummary(time: number) {
    this.optedTime = time;
    this.showAssetReadingsSummary(this.assetCode, this.limit, this.optedTime);
    this.plotReadingsGraph(this.assetCode, this.limit, this.optedTime);
  }

  public getAssetCode(assetCode: string) {
    this.isLatestReadings = false;
    this.isModalOpened = true;
    this.selectedTab = 1;
    this.loadPage = true;
    this.notify.emit(false);
    this.selectedAsset = assetCode;
    
    // remove selected graph asset from the dropdown list
    const index: number = this.availableAssets.indexOf(assetCode);
    if (index !== -1) {
        this.availableAssets.splice(index, 1);
    }  
    
    if (this.latestReadingSubscription) {
      this.latestReadingSubscription.unsubscribe();
    }

    if (this.graphRefreshInterval === -1) {
      this.isAlive = false;
    } else {
      this.isAlive = true;
    }

    let rGraphDefaultDuration = localStorage.getItem('READINGS_GRAPH_DEFAULT_DURATION');
    this.optedTime = rGraphDefaultDuration !== null ? parseInt(rGraphDefaultDuration) : ASSET_READINGS_TIME_FILTER;
    this.assetCode = assetCode;
    if (this.optedTime !== 0) {
      this.limit = 0;
      this.autoRefresh = false;
      this.plotReadingsGraph(assetCode, this.limit, this.optedTime);
    }
    this.subscription = interval(this.graphRefreshInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        this.autoRefresh = true;
        if (this.selectedTab === 4) {
          this.showAssetReadingsSummary(this.assetCode, this.limit, this.optedTime);
        } else {
          this.plotReadingsGraph(this.assetCode, this.limit, this.optedTime);
          this.refreshAssets.next();
        }
      });
  }

  addAsset() {
    this.plotReadingsGraph(this.assetCode, this.limit, this.optedTime);
  }

  removeAsset(assetCode) {
    if (this.selectedAsset === assetCode.value) {
      this.additionalAssets.push(assetCode.value);
      this.additionalAssets = [...this.additionalAssets];
    } else {
      this.plotReadingsGraph(this.assetCode, this.limit, this.optedTime);
    }
  }

  clearAdditionalAssets() {
    this.additionalAssets.push(this.selectedAsset);
    this.additionalAssets = [...this.additionalAssets];
  }

  getAssetLatestReadings(assetCode, isModalOpened = false) {
    this.loadPage = true;
    if (!isModalOpened) {
      this.isModalOpened = true;
    }
    this.notify.emit(false);
    this.isLatestReadings = true;
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.assetCode = assetCode;
    this.numberTypeReadingsList = [];
    this.arrayTypeReadingsList = [];
    this.stringTypeReadingsList = {};
    this.imageReadings = [];
    if (this.graphRefreshInterval === -1) {
      this.isAlive = false;
      this.getLatestReading(assetCode);
    } else {
      this.isAlive = true;
      this.getLatestReading(assetCode);
    }
    this.latestReadingSubscription = interval(this.graphRefreshInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        if (this.selectedTab === 4) {
          this.showAssetReadingsSummary(this.assetCode, this.limit, this.optedTime);
        } else {
          this.getLatestReading(assetCode);
        }
      });
  }

  getLatestReading(assetCode) {
    this.assetService.getLatestReadings(assetCode).subscribe((data: any) => {
      this.showSpinner = false;
      this.loadPage = false;
      this.autoRefresh = true;
      if (data.length === 0) {
        console.log('No readings found.');
        return;
      }
      this.setLatestReadings(data);
    },
      error => {
        this.showSpinner = false;
        console.log('error in response', error);
      });
  }

  getImage(readings) {
    readings.map((read) => {
      const imageData = read.imageData.replace('__DPIMAGE:', '').split('_');
      // Get base64 raw string
      const base64Str_ = imageData[1];
      // Get width, height and depth of the image and convert values into Number
      const [width, height, depth] = imageData[0].split(',').map(Number);
      // split image data

      let arrayBufferView = null;
      if (depth === 8) {
        arrayBufferView = Uint8Array.from(atob(base64Str_), c => c.charCodeAt(0));
        read.image = this.process8bitBitmap(arrayBufferView.buffer, { width, height });
      } else if (depth === 16) {
        //16 bit raw image array
        arrayBufferView = Uint16Array.from(atob(base64Str_), c => c.charCodeAt(0));
        read.image = this.process16bitBitmap(arrayBufferView, { width, height });
      } else if (depth === 24) {
        // 24 bit raw image array
        arrayBufferView = Uint8Array.from(atob(base64Str_), c => c.charCodeAt(0));
        read.image = this.process24bitBitmap(arrayBufferView.buffer, { width, height });
      } else {
        console.log(`Not supported, found ${depth}`);
        return;
      }
      return read;
    });
    return readings;
  }

  process8bitBitmap(buffer, options: any = {}) {
    const view = new Uint8ClampedArray(buffer);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.canvas.width = options.width;
    ctx.canvas.height = options.height;
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    let x = 0;
    for (let i = 0; i < imgData.data.length; i += 4) {
      imgData.data[i] = view[x];
      imgData.data[i + 1] = view[x];
      imgData.data[i + 2] = view[x++];
      imgData.data[i + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL("image/png");
  }

  process16bitBitmap(data, options: any = {}) {
    const view = new Uint16Array(data.buffer);
    // set up canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.canvas.width = options.width;
    ctx.canvas.height = options.height;
    const imgData = ctx.createImageData(canvas.width, canvas.height);

    const max_uint16 = Math.pow(2, 16) - 1;
    const max_uint8 = Math.pow(2, 8) - 1;
    let uint16_to_uint8 = max_uint8 / max_uint16;
    let x = 0;
    for (let i = 0; i < imgData.data.length; i += 4) {
      const num_16 = (view[x + 1] * 256) + view[x];
      const num_scaled_8 = Math.round(num_16 * uint16_to_uint8);
      imgData.data[i] = num_scaled_8;
      imgData.data[i + 1] = num_scaled_8;
      imgData.data[i + 2] = num_scaled_8;
      imgData.data[i + 3] = 255;
      x += 2;
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL("image/png");
  }

  process24bitBitmap(buffer, options: any = {}) {
    const view = new Uint8ClampedArray(buffer);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext("2d");
    ctx.canvas.width = options.width;
    ctx.canvas.height = options.height;
    const imgData = ctx.createImageData(options.width, options.height);
    let x = 0;
    for (let i = 0; i < imgData.data.length; i += 4) {
      imgData.data[i + 0] = view[x++];
      imgData.data[i + 1] = view[x++];
      imgData.data[i + 2] = view[x++];
      imgData.data[i + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL("image/png");
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
    let optedAssets = this.additionalAssets;
    optedAssets = optedAssets.filter((asset) => asset !== this.assetCode);

    this.limit = limit;
    this.assetService.getMultipleAssetReadings(encodeURIComponent(assetCode), +limit, 0, time, optedAssets)
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


  setLatestReadings(readings: any) {
    const strReadings = [];
    const imageReadings = [];
    this.timestamps = readings.reverse().map((r: any) => r.timestamp);
    for (const r of readings) {
      Object.entries(r.reading).forEach(([k, value]) => {
        // discard unuseful reading
        if (value === 'Data removed for brevity') {
          return;
        }
        if (typeof value === 'string') {
          if (value.includes("__DPIMAGE")) {
            imageReadings.push({
              datapoint: k,
              imageData: value,
              timestamp: this.dateFormatter.transform(r.timestamp, 'YYYY-MM-DD HH:mm:ss.SSS')
            });
          } else {
            strReadings.push({
              key: k,
              timestamp: r.timestamp,
              data: value
            });
          }
        } else {
          strReadings.push({
            key: k,
            data: JSON.stringify(value)
          });
        }
      });
    }
    this.imageReadings = imageReadings.length > 0 ? this.getImage(imageReadings) : [];
    this.stringTypeReadingsList = mapValues(groupBy(strReadings,
      (reading) => this.dateFormatter.transform(reading.timestamp, 'YYYY-MM-DD HH:mm:ss.SSS')), rlist => rlist.map(read => omit(read, 'timestamp')));
    this.setTabData();
  }

  getMergedReadings(allAssetsReading){
    let mergedReadings =[];
    allAssetsReading.map(function (item) {
      let existingReading = mergedReadings.find(x=> x.timestamp === item.timestamp);
      if (existingReading) {
        existingReading.timestamp = Object.assign({}, existingReading.timestamp, item.timestamp);
      } else {
        mergedReadings.push(item);
      }
    });
    console.log('mergedReadings', mergedReadings);
    return mergedReadings;
  }

  getReadings(readings: any) {
    const numReadings = [];
    const strReadings = [];
    const arrReadings = [];
    const imageReadings = [];
    console.log('readings', readings);
    
    if (this.additionalAssets.length > 1) {
      let allAssetsReading = [];
      this.additionalAssets.forEach((asset)=> {
        allAssetsReading.push(...readings[asset]);
      });
      readings = this.getMergedReadings(allAssetsReading);
    }
    this.timestamps = readings.reverse().map((r: any) => r.timestamp);

    for (const r of readings) {
      Object.entries(r.reading).forEach(([k, value]) => {
        // discard unuseful reading
        if (value === 'Data removed for brevity') {
          return;
        }
        if (typeof value === 'number') {
          numReadings.push({
            key: k,
            read: { x: r.timestamp, y: value }
          });
        } else if (typeof value === 'string') {
          if (value.includes("__DPIMAGE")) {
            imageReadings.push({
              datapoint: k,
              imageData: value,
              timestamp: this.dateFormatter.transform(r.timestamp, 'YYYY-MM-DD HH:mm:ss.SSS')
            });
          } else {
            strReadings.push({
              key: k,
              timestamp: r.timestamp,
              data: value
            });
          }
        } else if (Array.isArray(value)) {
          arrReadings.push({
            key: k,
            read: value
          });
        } else if (typeof value === 'object') {
          strReadings.push({
            key: k,
            data: JSON.stringify(value)
          });
        }
        else {
          console.log('Failed to parse reading ', value, ' for key ', k);
        }
      });
    }
    this.imageReadings = imageReadings.length > 0 ? this.getImage(imageReadings) : [];
    this.numberTypeReadingsList = numReadings.length > 0 ? this.mergeObjects(numReadings) : [];
    this.arrayTypeReadingsList = arrReadings.length > 0 ? this.mergeObjects(arrReadings) : [];
    this.stringTypeReadingsList = mapValues(groupBy(strReadings,
      (reading) => this.dateFormatter.transform(reading.timestamp, 'YYYY-MM-DD HH:mm:ss.SSS')), rlist => rlist.map(read => omit(read, 'timestamp')));
    this.setTabData();
  }

  setTabData() {
    this.showSpinner = false;
    if (this.isModalOpened) {
      if (this.numberTypeReadingsList.length > 0) {
        this.selectedTab = 1;
      } else if (this.arrayTypeReadingsList.length > 0) {
        this.selectedTab = 2;
      } else if (this.imageReadings.length > 0) {
        this.selectedTab = 5;
      } else if (!this.isEmptyObject(this.stringTypeReadingsList)) {
        this.selectedTab = 3;
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

    if (this.selectedTab === 4 && this.numberTypeReadingsList.length === 0) {
      if (this.arrayTypeReadingsList.length > 0) {
        this.selectedTab = 2;
      } else if (!this.isEmptyObject(this.stringTypeReadingsList)) {
        this.selectedTab = 3;
      }
    }

    if (this.selectedTab === 5 && this.imageReadings.length === 0) {
      if (this.arrayTypeReadingsList.length > 0) {
        this.selectedTab = 2;
      } else if (!this.isEmptyObject(this.stringTypeReadingsList)) {
        this.selectedTab = 3;
      }
    }

    if (this.selectedTab === 1 && this.numberTypeReadingsList.length > 0) {
      this.statsAssetReadingsGraph(this.numberTypeReadingsList);
    } else if (this.selectedTab === 2 && this.arrayTypeReadingsList.length > 0) {
      this.create3DGraph(this.arrayTypeReadingsList, this.timestamps);
    }
  }

  mergeObjects(assetReadings: any) {
    return chain(assetReadings).groupBy('key').map(function (group, key) {
      return {
        key: key,
        read: map(group, 'read')
      };
    }).value();
  }

  refresh() {
    if (!this.isAlive) {
      if (this.graphRefreshInterval === -1 && this.isLatestReadings) {
        this.getLatestReading(this.assetCode);
      } else {
        this.plotReadingsGraph(this.assetCode, this.limit, this.optedTime);
      }
      if (this.selectedTab === 4) {
        this.showAssetReadingsSummary(this.assetCode, this.limit, this.optedTime);
      }
    }
  }

  private statsAssetReadingsGraph(assetReadings: any): void {
    const dataset = [];
    assetReadings = orderBy(assetReadings, [reading => reading.key.toLowerCase()], ['asc']);
    for (const r of assetReadings) {
      r.read = r.read.map(dt => {
        dt.x = this.dateFormatter.transform(dt.x, 'YYYY-MM-DD HH:mm:ss.SSS')
        return dt;
      });
      const dsColor = Utils.namedColor(dataset.length);
      const dt = {
        label: r.key,
        data: r.read,
        fill: false,
        lineTension: 0.1,
        hidden: this.getLegendState(r.key),
        backgroundColor: dsColor,
        borderColor: this.getColorCode(r.key.trim(), dsColor)
      };
      if (dt.data.length) {
        dataset.push(dt);
      }
    }
    this.setAssetReadingValues(dataset);
  }

  getColorCode(readKey, dsColor) {
    let cc = '';
    if (!['RED', 'GREEN', 'BLUE', 'R', 'G', 'B'].includes(readKey.toUpperCase())) {
      cc = dsColor;
    }
    if (readKey.toUpperCase() === 'RED' || readKey.toUpperCase() === 'R') {
      cc = CHART_COLORS.red;
    } else if (readKey.toUpperCase() === 'BLUE' || readKey.toUpperCase() === 'B') {
      cc = CHART_COLORS.blue;
    } else if (readKey.toUpperCase() === 'GREEN' || readKey.toUpperCase() === 'G') {
      cc = CHART_COLORS.green;
    }
    return cc;
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

  private setAssetReadingValues(ds: any) {
    this.assetReadingValues = {
      datasets: ds
    };

    this.assetChartType = 'line';
    this.assetChartOptions = {
      elements: {
        point: { radius: this.isLatestReadings ? 2 : 0 }
      },
      scales: {
        xAxes: [{
          distribution: 'linear',
          type: 'time',
          time: {
            unit: 'second',
            tooltipFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
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

  create3DGraph(readings: any, ts: any) {
    readings = orderBy(readings, [reading => reading.key.toLowerCase()], ['asc']);
    const timestamps = ts.map((t: any) => this.dateFormatter.transform(t, 'HH:mm:ss.SSS'));
    this.polyGraphData = {
      data: [
        {
          type: 'surface',
          y: timestamps,
          z: readings.map(r => r.read)[0],
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
        title: this.assetCode,
        showlegend: true,
        autoSize: true,
        margin: {
          b: 40,
          l: 60,
          r: 10,
          t: 25
        }
      },
      config: {
        displayModeBar: false
      }
    };
    this.generate3Dgraph();
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
    if (this.graphRefreshInterval === -1 && this.selectedTab === 4) {
      this.showAssetReadingsSummary(this.assetCode, this.limit, this.optedTime);
    } else if (this.graphRefreshInterval === -1 && this.isLatestReadings) {
      this.getAssetLatestReadings(this.assetCode, true);
    } else if (this.graphRefreshInterval === -1) {
      this.plotReadingsGraph(this.assetCode, this.limit, this.optedTime);
    }
  }

  showSummaryTab() {
    return this.numberTypeReadingsList.length > 0 && !this.isLatestReadings;
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
