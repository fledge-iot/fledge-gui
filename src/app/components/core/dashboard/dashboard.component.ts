import { Component, OnDestroy, OnInit } from '@angular/core';
import map from 'lodash-es/map';
import { Observable } from 'rxjs/Rx';
import { AnonymousSubscription } from 'rxjs/Subscription';

import { AlertService, PingService, StatisticsService } from '../../../services';
import { GRAPH_REFRESH_INTERVAL, STATS_HISTORY_TIME_FILTER } from '../../../utils';
import { DateFormatterPipe } from '../../../pipes';

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

  selectedGraphsList = [] =
    [{ key: 'READINGS', checked: true },
    { key: 'Readings Sent', checked: true }];

  // Array of the graphs to show
  graphsToShow = [];

  public chartOptions: object;

  private timerSubscription: AnonymousSubscription;

  public refreshTimer = GRAPH_REFRESH_INTERVAL;
  public optedTime;

  DEFAULT_LIMIT = 20;

  constructor(private statisticsService: StatisticsService,
    private alertService: AlertService, private dateFormatter: DateFormatterPipe, private ping: PingService) { }

  ngOnInit() {
    // To check if data saved in valid format in local storage
    const optedGraphStorage = JSON.parse(localStorage.getItem('OPTED_GRAPHS'));
    if (optedGraphStorage != null && typeof (optedGraphStorage[0]) !== 'object') {
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

    if (selectedGraph.checked === false && this.selectedGraphsList.length > 0) {
      this.selectedGraphsList = this.selectedGraphsList.filter((dt => (dt !== undefined && dt.key !== selectedGraph.key)));
    } else {
      this.selectedGraphsList.push(selectedGraph);
    }

    // if there is no graph selected, set default to "READINGS" and "North Readings to PI"
    if (this.selectedGraphsList.length === 0) {
      this.selectedGraphsList = [
        { key: 'READINGS', checked: true },
        { key: 'Readings Sent', checked: true }];
    }

    localStorage.setItem('OPTED_GRAPHS', JSON.stringify(this.selectedGraphsList));
    this.getStatistics();
  }

  public getStatistics(): void {
    this.statisticsService.getStatistics().
      subscribe((data: any[]) => {
        // filter received data for FOGBENCH data
        this.statistics = data.filter(value => value['key'].toLowerCase().indexOf('fogbench') === -1);

        this.statisticsKeys = [];
        for (const stats of this.statistics) {
          this.statisticsKeys.push({ key: stats.key, checked: false });
        }

        // Rename 'key' to 'itemName' and add a new key as named 'id'
        for (let i = 0; i < this.statistics.length; i++) {
          this.statistics[i].id = i;
          this.statistics[i].itemName = this.statistics[i]['key'];
          delete this.statistics[i].key;
        }

        if (localStorage.getItem('OPTED_GRAPHS')) {
          this.selectedGraphsList = JSON.parse(localStorage.getItem('OPTED_GRAPHS'));
        }

        this.graphsToShow = [];
        for (const graph of this.selectedGraphsList) {
          const selectedGraph = this.statistics.filter(value => value['itemName'] === graph.key);
          this.statisticsKeys.map((item) => item.key === graph.key ? item.checked = true : false);
          this.graphsToShow.push(selectedGraph[0]);
        }
        this.getStatisticsHistory(localStorage.getItem('STATS_HISTORY_TIME_FILTER'));
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
  public refreshGraph() {
    this.statisticsService.getStatistics().
      subscribe((data: any[]) => {
        this.statistics = data.filter(value => value['key'].toLowerCase().indexOf('fogbench') === -1);

        this.statisticsKeys = [];
        for (const stats of this.statistics) {
          this.statisticsKeys.push({ key: stats.key, checked: false });
        }

        if (localStorage.getItem('OPTED_GRAPHS')) {
          this.selectedGraphsList = JSON.parse(localStorage.getItem('OPTED_GRAPHS'));
        }

        // Rename 'key' to 'itemName' and add a new key as named 'id'
        for (let i = 0; i < this.statistics.length; i++) {
          this.statistics[i].id = i;
          this.statistics[i].itemName = this.statistics[i]['key'];
          delete this.statistics[i].key;
        }

        for (const stats of this.statistics) {
          this.graphsToShow.map((item) => item.itemName === stats.itemName ? item.value = stats.value : item.value);
        }

        for (const graph of this.selectedGraphsList) {
          this.statisticsKeys.map((item) => item.key === graph.key ? item.checked = true : false);
        }
      },
        error => {
          if (error.status === 0) {
            console.log('service down', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public getStatisticsHistory(time = null): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
    if (time == null) {
      localStorage.setItem('STATS_HISTORY_TIME_FILTER', STATS_HISTORY_TIME_FILTER);
    } else {
      localStorage.setItem('STATS_HISTORY_TIME_FILTER', time);
    }
    this.optedTime = localStorage.getItem('STATS_HISTORY_TIME_FILTER');
    this.statisticsService.getStatisticsHistory(this.optedTime, null, null).
      subscribe((data: any[]) => {
        this.statisticsKeys.forEach(dt => {
          const labels = [];
          const record = map(data['statistics'], dt.key).reverse();
          let history_ts = map(data['statistics'], 'history_ts');
          history_ts = history_ts.reverse();
          history_ts.forEach(ts => {
            ts =  this.dateFormatter.transform(ts, 'HH:mm:ss');
            labels.push(ts);
          });
          this.graphsToShow = this.graphsToShow.filter(value => value !== undefined);
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
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  private refreshData(): void {
    this.timerSubscription = null;
    this.timerSubscription = Observable.timer(this.refreshTimer)
      .subscribe(() => {
        this.getStatisticsHistory(localStorage.getItem('STATS_HISTORY_TIME_FILTER'));
        this.refreshGraph();
      });
  }

  public toggleDropdown() {
    const dropDown = document.querySelector('#graph-key-dropdown');
    dropDown.classList.toggle('is-active');
  }

  public checkedGraph(event) {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
    const data = {
      key: event.target.value,
      checked: event.target.checked
    };
    this.showGraph(data);
  }
}
