import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { AssetsService } from '../../services/assets.service';
import ReadingsValidator from '../assets/readings-validator';
import { AssetSummaryService } from './../asset-summary/asset-summary-service';

@Component({
  selector: 'app-asset-summary',
  templateUrl: './asset-summary.component.html',
  styleUrls: ['./asset-summary.component.css']
})
export class AssetSummaryComponent implements OnInit {
  assetReadingSummary: any = [];
  assetCode: String = '';
  isValidData = false;
  isShow = false;
  invalidInputMessage = '';
  public assetChart: string;
  public summaryValues: any;
  public chartOptions: any;

  constructor(private assetService: AssetsService, private assetSummaryService: AssetSummaryService) { }

  ngOnInit() { }

  public toggleModal(shouldOpen: Boolean) {
    this.isShow = false;
    const summary_modal = <HTMLDivElement>document.getElementById('summary_modal');
    if (shouldOpen) {
      summary_modal.classList.add('is-active');
      return;
    }
    summary_modal.classList.remove('is-active');
    this.invalidInputMessage = '';
  }

  public getReadingSummary(dt) {
    this.isValidData = true;
    this.assetCode = dt.asset_code;
    this.assetService.getAssetReadings(encodeURIComponent(dt.asset_code)).
      subscribe(
      data => {
        if (data.error) {
          console.log('error in response', data.error);
          return;
        }
        const validRecord = ReadingsValidator.validate(data);
        if (validRecord) {
          const record = {
            asset_code: dt.asset_code,
            readings: data[0],
            time: dt.time_param
          };
          this.assetSummaryService.getReadingSummary(record);
          this.assetSummaryService.assetReadingSummary.subscribe(
            value => {
              this.assetReadingSummary = value;
            });
        } else {
          this.isValidData = false;
          console.log('No valid data to show trends.');
        }
      },
      error => { console.log('error', error); });
  }

  public getTimedBasedSummary(time, key) {
    this.invalidInputMessage = '';
    if (key === 'select') {
      return this.invalidInputMessage = 'Please select a valid time unit | *Displaying default data';
    }
    if (time === '') {
      time = 0;
    }
    if (!Number.isInteger(+time) || +time < 0) { // check for limit range
      return this.invalidInputMessage = 'Please enter valid time | *Displaying default data';
    }

    const asset = {
      asset_code: this.assetCode,
      time_param: (+time === (null || 0) ? undefined : { [key]: +time })
    };
    this.getReadingSummary(asset);
  }

  clear(st, selectedType) {
    selectedType.value = 'select'; // reset to default
    st.inputValue = null;
  }

  statsAssetReadingsSummaryGraph(summaryData): void {
    this.isShow = true;
    this.isValidData = true;
    const first_dataset = [];
    const second_dataset = [];
    const third_dataset = [];
    const labels = []; // chart labels array
    const assetSummaryData = [];
    let d1;
    let d2;
    let d3;
    let count = 0;
    for (const key in summaryData[0].summary[0]) {
      labels.push(key);  // keys for chart label values
    }
    // code block to put 'average' key in thie middle of array
    {
      labels.sort().reverse();
      const temp = labels[1];
      labels[1] = labels[2];
      labels[2] = temp;
    }
    for (const value of summaryData) {
      const summary = value.summary[0];
      if (summary['min'] === '' && summary['average'] === '' && summary['max'] === '') {
        this.isShow = false;
        return;
      }
      count++;
      switch (count) {
        case 1:
          first_dataset.push(summary['min']);
          first_dataset.push(summary['average']);
          first_dataset.push(summary['max']);
          d1 = {
            data: first_dataset,
            label: value.key
          };
          break;
        case 2:
          second_dataset.push(summary['min']);
          second_dataset.push(summary['average']);
          second_dataset.push(summary['max']);
          d2 = {
            data: second_dataset,
            label: value.key
          };
          break;
        case 3:
          third_dataset.push(summary['min']);
          third_dataset.push(summary['average']);
          third_dataset.push(summary['max']);
          d3 = {
            data: third_dataset,
            label: value.key
          };
          break;
        default:
          break;
      }
    }
    let ds = [];
    if (count === 3) {
      ds = [{
        label: d1.label,
        data: d1.data,
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        backgroundColor: '#3498DB',
        borderColor: '#85C1E9'
      },
      {
        label: d2.label,
        data: d2.data,
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        backgroundColor: '#239B56',
        borderColor: '#82E0AA',
      },
      {
        label: d3.label,
        data: d3.data,
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        backgroundColor: '#B03A2E',
        borderColor: '#F1948A',
      }];
    } else if (count === 2) {
      ds = [{
        label: d1.label,
        data: d1.data,
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        backgroundColor: '#3498DB',
        borderColor: '#85C1E9'
      },
      {
        label: d2.label,
        data: d2.data,
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        backgroundColor: '#239B56',
        borderColor: '#82E0AA',
      }];
    } else {
      ds = [{
        label: d1.label,
        data: d1.data,
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        backgroundColor: '#239B56',
        borderColor: '#82E0AA',
      }];
    }
    this.assetChart = 'line';
    this.summaryValues = {
      labels: labels,
      datasets: ds
    };
    this.chartOptions = {
      scales: {
        xAxes: [{
          ticks: {
            autoSkip: false,
            beginAtZero: true
          }
        }],
        yAxes: [{
          ticks: {
            autoSkip: false,
            beginAtZero: true
          }
        }]
      }
    };
    console.log('summary values', this.summaryValues);
  }
}
