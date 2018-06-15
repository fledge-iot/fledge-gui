import { Component, OnInit } from '@angular/core';
import map from 'lodash-es/map';
import * as moment from 'moment';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, StatisticsService } from '../../../services';
import { MAX_INT_SIZE } from '../../../utils';

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

  selectedKeys = [];

  // Object of dropdown setting
  dropdownSettings = {};

  selectedItems = [];

  // Array of the graphs to show
  graphsToShow = [];

  // Array of default graphs to show ('READINGS', 'SENT_1', 'PURGED')
  showDefaultGraphs = [];

  public chartOptions: object;

  public DEFAULT_LIMIT = 20;
  public MAX_RANGE = MAX_INT_SIZE;
  public limit = this.DEFAULT_LIMIT;
  public invalidLimitSize = false;

  constructor(private statisticsService: StatisticsService, private alertService: AlertService, public ngProgress: NgProgress) { }

  ngOnInit() {
    this.getStatistics();
  }

  public showGraph(graphs) {
    this.selectedKeys = [];
    // get keys selected from dropdown
    for (const k of graphs) {
      this.selectedKeys.push(k.itemName);
    }
    // save keys in local storage
    localStorage.setItem('OPTED_GRAPHS', JSON.stringify(this.selectedKeys));

    this.graphsToShow = [];
    for (const k of this.selectedKeys) {
      const selectedKeyData = [];
      selectedKeyData.push(this.statistics.filter(value => value['itemName'] === k));
      this.graphsToShow.push(selectedKeyData[0][0]);
    }
    this.getStatistics();
  }

  getLimitBasedGraph(limit) {
    this.invalidLimitSize = false;
    if (limit === null || limit === undefined) {
      limit = this.DEFAULT_LIMIT;
    }

    if (limit > this.MAX_RANGE) {
      this.invalidLimitSize = true; // limit range validation
      return;
    }

    this.getStatistics(limit);
  }

  public getStatistics(limit = this.DEFAULT_LIMIT): void {
    /** request started */
    this.ngProgress.start();

    this.statisticsService.getStatistics().
      subscribe((data: any[]) => {
        /** request completed */
        this.ngProgress.done();
        console.log('received statisticsData ', data);
        // filter received data for FOGBENCH data
        this.statistics = data.filter(value => value['key'].toLowerCase().indexOf('fogbench') === -1);
        console.log('statisticsData ', this.statistics);

        this.statisticsKeys = [];
        for (const d of this.statistics) {
          this.statisticsKeys.push(d.key);
        }
        console.log('keys array', this.statisticsKeys);

        // If graphs are not selected yet, then show graphs of 'READINGS', 'SENT_1' and 'PURGED' and save in local storage
        if (!localStorage.getItem('OPTED_GRAPHS')) {
          this.selectedKeys = ['READINGS', 'SENT_1', 'PURGED'];
          localStorage.setItem('OPTED_GRAPHS', JSON.stringify(this.selectedKeys));
        }

        // Rename 'key' to 'itemName' and add a new key as named 'id'
        for (let i = 0; i < this.statistics.length; i++) {
          this.statistics[i].id = i;
          this.statistics[i].itemName = this.statistics[i]['key'];
          delete this.statistics[i].key;
        }

        // Set the options for drop down setting
        this.dropdownSettings = {
          singleSelection: false,
          text: 'Select Graphs',
          selectAllText: 'Select All',
          unSelectAllText: 'UnSelect All',
          enableSearchFilter: true
        };

        if (localStorage.getItem('OPTED_GRAPHS')) {
          this.selectedKeys = JSON.parse(localStorage.getItem('OPTED_GRAPHS'));
          this.graphsToShow = [];
          for (const k of this.selectedKeys) {
            const selectedKeyData = [];
            selectedKeyData.push(this.statistics.filter(value => value['itemName'] === k));
            this.graphsToShow.push(selectedKeyData[0][0]);
          }
          console.log('graphsToShow', this.graphsToShow);
        }

        // Selected Items are the items, to show in the drop down (having keys- 'READINGS', 'SENT_1', 'PURGED')
        this.selectedItems = this.graphsToShow;

        this.getStatisticsHistory(limit);
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
    };
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
          fill: false,
          lineTension: 0
        }
      ]
    };
  }

  /**
   *  Refresh graphs
   */
  public refreshGraph() {
    this.getStatistics();
  }

  public getStatisticsHistory(limit = this.DEFAULT_LIMIT): void {
    this.statisticsService.getStatisticsHistory(limit).
      subscribe((data: any[]) => {
        this.limit = limit;
        this.statisticsKeys.forEach(key => {
          const labels = [];
          const record = map(data['statistics'], key);
          const history_ts = map(data['statistics'], 'history_ts');
          history_ts.forEach(element => {
            element = moment(element).format('HH:mm:ss');
            labels.push(element);
          });
          this.graphsToShow.map(statistics => {
            if (statistics.itemName == key) {
              statistics.chartValue = this.getChartValues(labels, record, 'rgb(144,238,144)');
              statistics.chartType = 'line';
              return statistics;
            }
          });
        });
      },
        error => {
          if (error.status === 0) {
            console.log('service down', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }
}
