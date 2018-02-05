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
  statisticsKeys = [];
  statistics = []

  bufferedChart: string;
  bufferedValues: any;

  discardedChart: string;
  discardedValues: any;

  readingChart: string;
  readingValues: any;

  purgeChart: string;
  purgedValues: any;

  sent_1Chart: string;
  sent_1Values: any;

  sent_2Chart: string;
  sent_2Values: any;

  sent_3Chart: string;
  sent_3Values: any;

  sent_4Chart: string;
  sent_4Values: any;

  unsentChart: string;
  unsentValues: any;

  unsnpurgedChart: string;
  unsnpurgedValues: any;
  public chartOptions: any;

  constructor(private statisticsService: StatisticsService, private alertService: AlertService, public ngProgress: NgProgress) {

    this.bufferedChart = 'line';
    this.bufferedValues = [];

    this.discardedChart = 'line';
    this.discardedValues = [];

    this.readingChart = 'line';
    this.readingValues = [];

    this.purgeChart = 'line';
    this.purgedValues = [];

    this.sent_1Chart = 'line';
    this.sent_1Values = [];

    this.sent_2Chart = 'line';
    this.sent_2Values = [];

    this.sent_3Chart = 'line';
    this.sent_3Values = [];

    this.sent_4Chart = 'line';
    this.sent_4Values = [];

    this.unsentChart = 'line';
    this.unsentValues = [];

    this.unsnpurgedChart = 'line';
    this.unsnpurgedValues = [];
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
        console.log('recived statisticsData ', data);
        this.statistics = data;
        const o: object = {};
        data.forEach(element => {
          o[element.key] = element.value;
        });
        this.statisticsData = o;
        console.log('This is the statisticsData ', this.statisticsData);
        let keys = Object.keys(this.statisticsData)
        this.statisticsKeys = keys.filter(value => (!/FOGBENCH/.test(value)))
        console.log('keys array', this.statisticsKeys);
      },
      error => {
        /** request completed */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          console.log('error in response ', error);
          this.alertService.error(error.statusText);
        }
        console.log('error', error);
      });
  }

  public getStatisticsHistory(): void {
    const readingsValues = [];
    const readingsLabels = [];

    const discardedValues = [];
    const discardedLabels = [];

    const bufferedValues = [];
    const bufferedLabels = [];

    const purgedValues = [];
    const purgedLabels = [];

    const sent_1Values = [];
    const sent_1Labels = [];

    const sent_2Values = [];
    const sent_2Labels = [];

    const sent_3Values = [];
    const sent_3Labels = [];

    const sent_4Values = [];
    const sent_4Labels = [];

    const unsentValues = [];
    const unsentLabels = [];

    const unsnpurgedValues = [];
    const unsnpurgedLabels = [];

    const datePipe = new MomentDatePipe();

    this.statisticsService.getStatisticsHistory().
      subscribe(data => {
        this.statHistoryData = data.statistics;
        console.log('Statistics History Data', data);
        this.statHistoryData.forEach(element => {
          Object.keys(element).forEach(aKey => {
            this.statisticsKeys.forEach(keyInfo => {
              if (aKey.indexOf(keyInfo) !== -1) {
                var objValues = eval(keyInfo.toLowerCase() + 'Values');
                objValues.push(element[aKey]);
                const tempDt = element['history_ts'];
                var objLabels = eval(keyInfo.toLowerCase() + 'Labels');
                objLabels.push(datePipe.transform(data.timestamp, 'HH:mm:ss:SSS'));
              }
            })
          });
        });

        this.statsHistoryBufferedGraph(bufferedLabels, bufferedValues);
        this.statsHistoryDiscardedGraph(discardedLabels, discardedValues);
        this.statsHistoryReadingsGraph(readingsLabels, readingsValues);
        this.statsHistoryPurgedGraph(purgedLabels, purgedValues);
        this.statsHistorySent1Graph(sent_1Labels, sent_1Values);
        this.statsHistorySent2Graph(sent_2Labels, sent_2Values);
        this.statsHistorySent3Graph(sent_3Labels, sent_3Values);
        this.statsHistorySent4Graph(sent_4Labels, sent_4Values);
        this.statsHistoryUnsentGraph(unsentLabels, unsentValues);
        this.statsHistoryUnsnpurgedGraph(unsnpurgedLabels, unsnpurgedValues);
      },
      error => {
        if (error.status === 0) {
          console.log('service down', error);
        } else {
          console.log('error in response ', error);
          this.alertService.error(error.statusText);
        }
      });
  }

  statsHistoryBufferedGraph(labels, data): void {
    this.bufferedChart = 'line';
    this.bufferedValues = {
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

    for (var i in this.statistics) {
      if (this.statistics[i].key == 'BUFFERED') {
        this.statistics[i].chartValue = this.bufferedValues;
        this.statistics[i].chartType = this.bufferedChart;
      }
    }
  }

  statsHistoryDiscardedGraph(labels, data): void {
    this.discardedChart = 'line';
    this.discardedValues = {
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
    for (var i in this.statistics) {
      if (this.statistics[i].key == 'DISCARDED') {
        this.statistics[i].chartValue = this.discardedValues;
        this.statistics[i].chartType = this.discardedChart;
      }
    }
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
    for (var i in this.statistics) {
      if (this.statistics[i].key == 'READINGS') {
        this.statistics[i].chartValue = this.readingValues;
        this.statistics[i].chartType = this.readingChart;
      }
    }
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
    for (var i in this.statistics) {
      if (this.statistics[i].key == 'PURGED') {
        this.statistics[i].chartValue = this.purgedValues;
        this.statistics[i].chartType = this.purgeChart;
      }
    }
  }

  statsHistorySent1Graph(labels, data): void {
    this.sent_1Chart = 'line';
    this.sent_1Values = {
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
    for (var i in this.statistics) {
      if (this.statistics[i].key == 'SENT_1') {
        this.statistics[i].chartValue = this.sent_1Values;
        this.statistics[i].chartType = this.sent_1Chart;
      }
    }
  }

  statsHistorySent2Graph(labels, data): void {
    this.sent_2Chart = 'line';
    this.sent_2Values = {
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
    for (var i in this.statistics) {
      if (this.statistics[i].key == 'SENT_2') {
        this.statistics[i].chartValue = this.sent_2Values;
        this.statistics[i].chartType = this.sent_2Chart;
      }
    }
  }

  statsHistorySent3Graph(labels, data): void {
    this.sent_3Chart = 'line';
    this.sent_3Values = {
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
    for (var i in this.statistics) {
      if (this.statistics[i].key == 'SENT_3') {
        this.statistics[i].chartValue = this.sent_3Values;
        this.statistics[i].chartType = this.sent_3Chart;
      }
    }
  }

  statsHistorySent4Graph(labels, data): void {
    this.sent_4Chart = 'line';
    this.sent_4Values = {
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
    for (var i in this.statistics) {
      if (this.statistics[i].key == 'SENT_4') {
        this.statistics[i].chartValue = this.sent_4Values;
        this.statistics[i].chartType = this.sent_4Chart;
      }
    }
  }

  statsHistoryUnsentGraph(labels, data): void {
    this.unsentChart = 'line';
    this.unsentValues = {
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
    for (var i in this.statistics) {
      if (this.statistics[i].key == 'UNSENT') {
        this.statistics[i].chartValue = this.unsentValues;
        this.statistics[i].chartType = this.unsentChart;
      }
    }
  }

  statsHistoryUnsnpurgedGraph(labels, data): void {
    this.unsnpurgedChart = 'line';
    this.unsnpurgedValues = {
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
    for (var i in this.statistics) {
      if (this.statistics[i].key == 'UNSNPURGED') {
        this.statistics[i].chartValue = this.unsnpurgedValues;
        this.statistics[i].chartType = this.unsnpurgedChart;
      }
    }
  }
}
