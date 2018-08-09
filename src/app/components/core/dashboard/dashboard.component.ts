import { Component, OnDestroy, OnInit } from '@angular/core';
import map from 'lodash-es/map';
import * as moment from 'moment';
import { Observable } from 'rxjs/Rx';
import { AnonymousSubscription } from 'rxjs/Subscription';

import { AlertService, StatisticsService, PingService } from '../../../services';
import { GRAPH_REFRESH_INTERVAL } from '../../../utils';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit, OnDestroy {
  // Filtered array of received statistics data (having objects except key @FOGBENCH).
  statistics = [];

  // Array of Statistics Keys (["BUFFERED", "DISCARDED", "PURGED", ....])
  statisticsKeys = [];

  selectedKeys = [] = [{ key: 'READINGS', checked: true },
  { key: 'PURGED', checked: true },
  { key: 'North Readings to PI', checked: true }];

  // Array of the graphs to show
  graphsToShow = [];

  public chartOptions: object;

  private timerSubscription: AnonymousSubscription;
  private postsSubscription: AnonymousSubscription;

  public refreshTimer = GRAPH_REFRESH_INTERVAL;

  DEFAULT_LIMIT = 20;

  constructor(private statisticsService: StatisticsService, private alertService: AlertService, private ping: PingService) { }

  ngOnInit() {
    // To check if data saved in valid format in local storage
    const optedGraphStorage = JSON.parse(localStorage.getItem('OPTED_GRAPHS'));
    console.log(typeof (optedGraphStorage), optedGraphStorage);
    if (optedGraphStorage.length === 0  || typeof (optedGraphStorage[0]) !== 'object') {
      localStorage.removeItem('OPTED_GRAPHS');
    }
    this.getStatistics();
    this.ping.refreshIntervalChanged.subscribe((timeInterval: number) => {
      this.refreshTimer = timeInterval;
    });
  }

  public showGraph(selectedGraph) {
    // get keys selected from drop down
    this.statisticsKeys.map((item) => (item.key === selectedGraph.key && selectedGraph.checked === false) ? item.checked = false : true);
    if (selectedGraph.checked === false && this.selectedKeys.length > 0) {
      this.selectedKeys = this.selectedKeys.filter((dt => dt.key !== selectedGraph.key));
    } else {
      this.selectedKeys.push(selectedGraph);
    }

    // if there is no graph selected the set default to READINGS and PURGED
    if (this.selectedKeys.length === 0) {
      this.selectedKeys = [
        { key: 'READINGS', checked: true },
        { key: 'PURGED', checked: true },
        { key: 'North Readings to PI', checked: true }];
    }

    localStorage.setItem('OPTED_GRAPHS', JSON.stringify(this.selectedKeys));
    this.graphsToShow = [];
    for (const dt of this.selectedKeys) {
      const selectedKeyData = [];
      selectedKeyData.push(this.statistics.filter(value => value['itemName'] === dt.key));
      this.graphsToShow.push(selectedKeyData[0][0]);
    }
    this.getStatistics();
  }

  public getStatistics(): void {
    this.statisticsService.getStatistics().
      subscribe((data: any[]) => {
        // filter received data for FOGBENCH data
        this.statistics = data.filter(value => value['key'].toLowerCase().indexOf('fogbench') === -1);

        this.statisticsKeys = [];
        for (const d of this.statistics) {
          this.statisticsKeys.push({ key: d.key, checked: false });
        }

        // If graphs are not selected yet, then show graphs of 'READINGS' and 'PURGED' and save in local storage
        const optedGraphKeys = localStorage.getItem('OPTED_GRAPHS');
        if (optedGraphKeys) {
          const optedGraphKeysList = JSON.parse(optedGraphKeys);
          this.selectedKeys = optedGraphKeysList.filter(function (v) { return !v.key.startsWith('SENT_'); });
        }
        localStorage.setItem('OPTED_GRAPHS', JSON.stringify(this.selectedKeys));

        // Rename 'key' to 'itemName' and add a new key as named 'id'
        for (let i = 0; i < this.statistics.length; i++) {
          this.statistics[i].id = i;
          this.statistics[i].itemName = this.statistics[i]['key'];
          delete this.statistics[i].key;
        }

        if (localStorage.getItem('OPTED_GRAPHS')) {
          this.selectedKeys = JSON.parse(localStorage.getItem('OPTED_GRAPHS'));
          this.graphsToShow = [];
          for (const dt of this.selectedKeys) {
            const selectedKeyData = [];
            const selectedGraph = this.statistics.filter(value => value['itemName'] === dt.key);
            this.statisticsKeys.map((item) => item.key === dt.key ? item.checked = true : false);
            selectedKeyData.push(selectedGraph);
            this.graphsToShow.push(selectedKeyData[0][0]);
          }
        }

        this.getStatisticsHistory();
      },
        error => {
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
  public refreshGraph(limit, keyToRefresh) {
    let updatedValue = '';
    this.statisticsService.getStatistics().
      subscribe((data: any[]) => {
        const keyData = data.filter(value => value['key'] === keyToRefresh);
        updatedValue = keyData[0]['value'];
      },
        error => {
          if (error.status === 0) {
            console.log('service down', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
    this.statisticsService.getStatisticsHistory(limit, keyToRefresh).
      subscribe((data: any[]) => {
        this.graphsToShow.forEach(key => {
          if (key.itemName === keyToRefresh) {
            const labels = [];
            const record = map(data['statistics'], keyToRefresh);
            const history_ts = map(data['statistics'], 'history_ts');
            history_ts.forEach(element => {
              element = moment(element).format('HH:mm:ss');
              labels.push(element);
            });
            this.graphsToShow.map(statistics => {
              if (statistics.itemName === keyToRefresh) {
                statistics.chartValue = this.getChartValues(labels, record, 'rgb(144,238,144)');
                statistics.chartType = 'line';
                statistics.value = updatedValue;
                statistics.limit = limit;
              }
            });
          }
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

  public getStatisticsHistory(): void {
    this.statisticsService.getStatisticsHistory(this.DEFAULT_LIMIT, null).
      subscribe((data: any[]) => {
        this.statisticsKeys.forEach(dt => {
          const labels = [];
          const record = map(data['statistics'], dt.key);
          const history_ts = map(data['statistics'], 'history_ts');
          history_ts.forEach(element => {
            element = moment(element).format('HH:mm:ss');
            labels.push(element);
          });
          this.graphsToShow.map(statistics => {
            if (statistics.itemName === dt.key) {
              statistics.chartValue = this.getChartValues(labels, record, 'rgb(144,238,144)');
              statistics.chartType = 'line';
              statistics.limit = this.DEFAULT_LIMIT;
            }
          });
        });
        this.refreshData();
      },
        error => {
          if (error.status === 0) {
            console.log('service down', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public ngOnDestroy(): void {
    if (this.postsSubscription) {
      this.postsSubscription.unsubscribe();
    }
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  private refreshData(): void {
    this.timerSubscription = Observable.timer(this.refreshTimer)
      .subscribe(() => this.getStatisticsHistory());
  }

  toggleDropdown() {
    const dropDown = document.querySelector('.dropdown');
    dropDown.classList.toggle('is-active');
  }

  checkedGraph(event) {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    const data = {
      key: event.target.value,
      checked: event.target.checked
    };
    this.showGraph(data);
  }
}
