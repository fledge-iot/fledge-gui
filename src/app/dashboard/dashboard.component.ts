import { Component, OnInit } from '@angular/core';
import { StatisticsService, AlertService } from '../services/index';
import Utils from '../utils';
import { MomentDatePipe } from './../pipes/moment-date';
import { NgProgress } from 'ngx-progressbar';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  statisticsData = {};
  statHistoryData = [];

  readingChart: string;
  readingValues: any;

  purgeChart: string;
  purgedValues: any;

  sentChart: string;
  sentValues: any;
  public chartOptions: any;

  constructor(private statisticsService: StatisticsService, private alertService: AlertService, public ngProgress: NgProgress) {

    this.readingChart = 'line';
    this.readingValues = [];

    this.purgeChart = 'line';
    this.purgedValues = [];

    this.sentChart = 'line';
    this.sentValues = [];
  }

  ngOnInit() {
    this.getStatistics();
    this.getStatisticsHistory();
  }

  public getStatistics(): void {
    /** request started */
    this.ngProgress.start();
    this.statisticsService.getStatistics().
      subscribe(
        data => {
          /** request completed */
          this.ngProgress.done();

          if (data.error) {
            console.log('error in response', data.error);
            this.alertService.error(data.error.message);
            return;
          }
          console.log('recived statisticsData ', data);
          // this.statisticsData = data;
          const o: object = {};
          data.forEach(element => {
            o[element.key] = element.value;
          });
          this.statisticsData = o;
          console.log('This is the statisticsData ', this.statisticsData);
        },
        error => { 
          /** request completed */
          this.ngProgress.done();
          console.log('error', error); 
        });
  }

  public getStatisticsHistory(): void {
    const readingsValues = [];
    const readingsLabels = [];

    const purgedValues = [];
    const purgedLabels = [];

    const sentValues = [];
    const sentLabels = [];
    const datePipe = new MomentDatePipe();
    this.statisticsService.getStatisticsHistory().
      subscribe(data => {
        if (data.error) {
          console.log('error in response', data.error);
          this.alertService.error(data.error.message);
          return;
        }
        this.statHistoryData = data.statistics;
        console.log('Statistics History Data', data);
        this.statHistoryData.forEach(element => {
          Object.keys(element).forEach(aKey => {
            if (aKey.indexOf('READINGS') !== -1) {
              readingsValues.push(element[aKey]);
              const tempDt = element['history_ts'];
              readingsLabels.push( datePipe.transform(data.timestamp, 'HH:mm:ss:SSS'));
            }
            if (aKey.indexOf('PURGED') !== -1 && aKey.indexOf('UNSNPURGED') === -1) {
              purgedValues.push(element[aKey]);
              const tempDt = element['history_ts'];
              purgedLabels.push( datePipe.transform(data.timestamp, 'HH:mm:ss:SSS'));
            }
            if (aKey.indexOf('SENT_1') !== -1 && aKey.indexOf('UNSENT') === -1) {
              sentValues.push(element[aKey]);
              const tempDt = element['history_ts'];
              sentLabels.push( datePipe.transform(data.timestamp, 'HH:mm:ss:SSS'));
            }
          });
        });
        this.statsHistoryReadingsGraph(readingsLabels, readingsValues);
        this.statsHistoryPurgedGraph(purgedLabels, purgedValues);
        this.statsHistorySentGraph(sentLabels, sentValues);
      },
      error => { console.log('error', error); });
  }

  statsHistoryReadingsGraph(labels, data): void {
    this.readingChart = 'line';
    this.readingValues = {
      labels: labels,
      datasets: [
        {
          label: '',
          data: data,
          backgroundColor: 'rgb(100,149,237)',
        }
      ]
    };
    this.chartOptions = {
      legend: {
        display: false // fixme: not working
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
    };
  }

  statsHistoryPurgedGraph(labels, data): void {
    this.purgeChart = 'line';
    this.purgedValues = {
      labels: labels,
      datasets: [
        {
          label: '',
          data: data,
          backgroundColor: 'rgb(255,165,0)'
        }
      ]
    };
    this.chartOptions = {
      legend: {
        display: false // fixme: not working
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
    };
  }

  statsHistorySentGraph(labels, data): void {
    this.sentChart = 'line';
    this.sentValues = {
      labels: labels,
      datasets: [
        {
          label: '',
          data: data,
          backgroundColor: 'rgb(144,238,144)'
        }
      ]
    };
    this.chartOptions = {
      legend: {
        display: false // fixme: not working
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
    };
  }
}
