import { Component, OnInit } from '@angular/core';

import { MomentDatePipe } from '../../../../pipes/moment-date';
import { AssetsService } from '../../../../services';
import ReadingsValidator from '../assets/readings-validator';
import { AssetSummaryService } from './../asset-summary/asset-summary-service';
import { MAX_INT_SIZE } from '../../../../utils';
import { NgProgress } from 'ngx-progressbar';

@Component({
  selector: 'app-readings-graph',
  templateUrl: './readings-graph.component.html',
  styleUrls: ['./readings-graph.component.css']
})
export class ReadingsGraphComponent implements OnInit {
  public assetChart: string;
  public assetReadingValues: any;
  public assetCode;
  public showGraph = true;
  public assetReadingSummary = [];
  public isReadingsAvailable = false;
  public isInvalidLimit = false;
  public isInvalidOffset = false;
  public MAX_RANGE = MAX_INT_SIZE;

  constructor(private assetService: AssetsService, private assetSummaryService: AssetSummaryService, public ngProgress: NgProgress) {
    this.assetChart = 'line';
    this.assetReadingValues = [];
  }

  ngOnInit() { }

  public toggleModal(shouldOpen: Boolean) {
    const chart_modal = <HTMLDivElement>document.getElementById('chart_modal');
    if (shouldOpen) {
      chart_modal.classList.add('is-active');
      return;
    }
    chart_modal.classList.remove('is-active');
    this.assetCode = '';
  }

  public plotReadingsGraph(assetCode, limit: any, offset: any) {
    this.isReadingsAvailable = true;
    this.isInvalidLimit = false;
    this.isInvalidOffset = false;
    this.showGraph = true;
    if (limit === undefined || limit === '' || limit === 0) {
      limit = 100;
    }
    if (offset === undefined || offset === '') {
      offset = 0;
    }

    if (!Number.isInteger(+limit) || +limit < 0 || +limit > this.MAX_RANGE) { // max limit of int in c++
      this.isInvalidLimit = true;
    }
    if (!Number.isInteger(+offset) || +offset < 0 || +offset > this.MAX_RANGE) {  // max limit of int in c++
      this.isInvalidOffset = true;
    }

    if (this.isInvalidLimit || this.isInvalidOffset) {
      const labels = [];
      const ds = [];
      this.setAssetReadingValues(labels, ds);
    }

    this.assetCode = assetCode;
    this.ngProgress.start();
    this.assetService.getAssetReadings(encodeURIComponent(assetCode), +limit, +offset).
      subscribe(
        (data: any[]) => {
          this.ngProgress.done();
          if (data.length === 0) {
            this.isReadingsAvailable = false;
            const labels = [];
            const ds = [];
            this.setAssetReadingValues(labels, ds);
            return;
          }
          const validRecord = ReadingsValidator.validate(data);
          if (validRecord) {
            this.getAssetTimeReading(data);
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
          } else {
            this.showGraph = false;
            const labels = [];
            const ds = [];
            this.setAssetReadingValues(labels, ds);
            console.log('No valid data to show trends.');
          }
        },
        error => {
          this.ngProgress.done();
          console.log('error in response', error);
        });
  }

  getAssetTimeReading(assetChartRecord) {
    const assetTimeLabels = [];
    let assetReading = [];
    const first_dataset = [];
    const second_dataset = [];
    const third_dataset = [];
    let d1;
    let d2;
    let d3;
    const datePipe = new MomentDatePipe();
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
      assetTimeLabels.push(datePipe.transform(data.timestamp, 'HH:mm:ss:SSS'));
    });
    assetReading.push(d1);
    assetReading.push(d2);
    assetReading.push(d3);
    // remove undefined dataset from the array
    assetReading = assetReading.filter(function (n) { return n !== undefined; });
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
    } else {
      ds = [{
        label: assetReading[0].label,
        data: assetReading[0].data,
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

  clearField(limitField, offsetField) {
    limitField.inputValue = '';
    offsetField.inputValue = '';
  }
}
