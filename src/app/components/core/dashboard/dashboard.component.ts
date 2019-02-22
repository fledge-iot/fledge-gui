import { Component, OnDestroy, OnInit } from '@angular/core';
import { map } from 'lodash';
import { interval } from 'rxjs';
import 'rxjs/add/operator/takeWhile';

import { DateFormatterPipe } from '../../../pipes';
import { AlertService, PingService, StatisticsService } from '../../../services';
import { GRAPH_REFRESH_INTERVAL, STATS_HISTORY_TIME_FILTER } from '../../../utils';

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

  public refreshInterval = GRAPH_REFRESH_INTERVAL;
  public optedTime;

  DEFAULT_LIMIT = 20;
  private isAlive: boolean;

  constructor(private statisticsService: StatisticsService,
    private alertService: AlertService,
    private dateFormatter: DateFormatterPipe,
    private ping: PingService) {
    this.isAlive = true;
    this.ping.refreshIntervalChanged.subscribe((timeInterval: number) => {
      if (timeInterval === -1) {
        this.isAlive = false;
      }
      this.refreshInterval = timeInterval;
    });
  }

  ngOnInit() {
    // To check if data saved in valid format in local storage
    const optedGraphStorage = JSON.parse(localStorage.getItem('OPTED_GRAPHS'));
    if (optedGraphStorage != null && typeof (optedGraphStorage[0]) !== 'object') {
      localStorage.removeItem('OPTED_GRAPHS');
    }
    this.getStatistics();
    interval(this.refreshInterval)
      .takeWhile(() => this.isAlive) // only fires when component is alive
      .subscribe(() => {
        this.refreshGraph();
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

    // if there is no graph selected, set default to "READINGS" and "Readings Sent"
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

        if (localStorage.getItem('OPTED_GRAPHS')) {
          this.selectedGraphsList = JSON.parse(localStorage.getItem('OPTED_GRAPHS'));
        }
        this.graphsToShow = [];
        for (const graph of this.selectedGraphsList) {
          const selectedGraph = this.statistics.find(value => value['key'] === graph.key);
          this.statisticsKeys.map((item) => item.key === graph.key ? item.checked = true : false);
          if (selectedGraph !== undefined) {
            this.graphsToShow.push(selectedGraph);
          }
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
        for (const stats of this.statistics) {
          this.graphsToShow.map((item) => item.key === stats.key ? item.value = stats.value : item.value);
        }
        this.refreshStatisticsHistory();
      },
        error => {
          if (error.status === 0) {
            console.log('service down', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public refreshStatisticsHistory(): void {
    this.statisticsService.getStatisticsHistory(this.optedTime).
      subscribe((data: any[]) => {
        this.statisticsKeys.forEach(dt => {
          const labels = [];
          const record = map(data['statistics'], dt.key).reverse();
          let history_ts = map(data['statistics'], 'history_ts');
          history_ts = history_ts.reverse();
          history_ts.forEach(ts => {
            ts = this.dateFormatter.transform(ts, 'HH:mm:ss');
            labels.push(ts);
          });
          this.graphsToShow = this.graphsToShow.filter(value => value !== undefined);
          this.graphsToShow.map(statistics => {
            if (statistics.key === dt.key) {
              statistics.chartValue = this.getChartValues(labels, record, 'rgb(144,238,144)');
              statistics.chartType = 'line';
              statistics.limit = this.DEFAULT_LIMIT;
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

  public getStatisticsHistory(time = null): void {
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
            ts = this.dateFormatter.transform(ts, 'HH:mm:ss');
            labels.push(ts);
          });
          this.graphsToShow = this.graphsToShow.filter(value => value !== undefined);
          this.graphsToShow.map(statistics => {
            if (statistics.key === dt.key) {
              statistics.chartValue = this.getChartValues(labels, record, 'rgb(144,238,144)');
              statistics.chartType = 'line';
              statistics.limit = this.DEFAULT_LIMIT;
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

  public toggleDropdown() {
    const dropDown = document.querySelector('#graph-key-dropdown');
    dropDown.classList.toggle('is-active');
  }

  public checkedGraph(event) {
    const data = {
      key: event.target.value,
      checked: event.target.checked
    };
    this.showGraph(data);
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
  }
}
