import { Component, OnInit } from '@angular/core';
import { StatisticsService, AlertService } from '../services/index';
import Utils from '../utils';
import { MomentDatePipe } from './../pipes/moment-date';
import { NgProgress } from 'ngx-progressbar';

import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {
  // Filtered array of received statistics data (having objects except key @FOGBENCH).
  statistics = [];
  
  // Array of Statistics Keys (["BUFFERED", "DISCARDED", "PURGED", ....])
  statisticsKeys = [];

  // Object of dropdown setting
  dropdownSettings = {};

  selectedItems = [];

  // Array of the graphs to show
  graphsToShow = []; 

  showDefaultGraphs = [];

  public chartOptions: object;

  constructor(private statisticsService: StatisticsService, private alertService: AlertService, public ngProgress: NgProgress) {}

  ngOnInit() {
    this.getStatistics();
  }

  public showGraph(graphs) {
    this.graphsToShow = graphs;
  }

  public getStatistics(): void {
    /** request started */
    this.ngProgress.start();

    this.statisticsService.getStatistics().
      subscribe(data => {
        /** request completed */
        this.ngProgress.done();
        console.log('received statisticsData ', data);
        // filter received data for FOGBENCH data  
        this.statistics = data.filter(value => value['key'].toLowerCase().indexOf('fogbench') === -1);
        console.log('statisticsData ', this.statistics);

        for (let data of this.statistics) {
          this.statisticsKeys.push(data.key);
        }
        console.log('keys array', this.statisticsKeys);

        // show default graphs ('READINGS', 'SENT_1', 'PURGED') on fresh launch of the app
        if (this.graphsToShow.length === 0) {
          this.showDefaultGraphs = this.statistics.filter(value => value['key'] == 'READINGS' || value['key'] == 'SENT_1' || value['key'] == 'PURGED')
        }
        this.graphsToShow = this.showDefaultGraphs;
        
        // Rename 'key' to 'itemName' and add a new key as named 'id'
        for(var i = 0; i < this.statistics.length; i++){
          this.statistics[i].id = i;
          this.statistics[i].itemName = this.statistics[i]['key'];
          delete this.statistics[i].key;
        }

        this.dropdownSettings = { 
          singleSelection: false,
          text:"Select Graphs",
          selectAllText:'Select All',
          unSelectAllText:'UnSelect All',
          enableSearchFilter: true
        };
        this.selectedItems = this.graphsToShow;
        this.getStatisticsHistory(this.statisticsKeys);
      },
      error => {
        /** request completed */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  protected getChartOptions() {
    this.chartOptions = {
      legend: {
        display: false
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
    }
  }

  protected getChartValues(labels, data, color) {
    this.getChartOptions();
    return {
      labels: labels,
      datasets: [
        {
          label: '',
          data: data,
          backgroundColor: color,
        }
      ]
    }
  }

  public getStatisticsHistory(statisticsKeys): void {
    this.statisticsService.getStatisticsHistory().
      subscribe(data => {
        console.log('data', data);
        this.statisticsKeys.forEach(key => {
          let labels = [];
          let record = _.map(data.statistics, key)
          let history_ts = _.map(data.statistics, 'history_ts');
          history_ts.forEach(element => {
            element = moment(element.timestamp).format('HH:mm:ss:SSS')
            labels.push(element)
          });
          this.statistics.map(statistics => {
            if (statistics.itemName == key) {
              statistics.chartValue = this.getChartValues(labels, record, 'rgb(144,238,144)');;
              statistics.chartType = 'line';
              return statistics;
            }
          });
        })
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
}
