import { Component, OnInit, OnDestroy } from '@angular/core';
import { SchedulesService, AlertService, PingService } from '../../../../services';
import { NgProgress } from 'ngx-progressbar';
import { POLLING_INTERVAL } from '../../../../utils';
import { AnonymousSubscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Rx';

@Component({
  selector: 'app-list-tasks',
  templateUrl: './list-tasks.component.html',
  styleUrls: ['./list-tasks.component.css']
})
export class ListTasksComponent implements OnInit, OnDestroy {
  public tasksData = [];
  public selectedTaskType = 'Latest'; // Default is LATEST
  public refreshInterval = POLLING_INTERVAL;
  private timerSubscription: AnonymousSubscription;
  private REQUEST_TIMEOUT_INTERVAL = 5000;

  constructor(
    private schedulesService: SchedulesService,
    private alertService: AlertService,
    public ngProgress: NgProgress,
    private ping: PingService
  ) {}

  ngOnInit() {
    this.getLatestTasks();
    this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
      this.refreshInterval = timeInterval;
    });
  }

  /**
   * Get tasks by state {RUNNING, LATEST}
   * @param state Task state
   */
  public getTasks(state) {
    this.tasksData = [];
    if (state.toUpperCase() === 'RUNNING') {
      this.selectedTaskType = 'Running';
      this.getRunningTasks();
    } else {
      this.selectedTaskType = 'Latest';
      this.getLatestTasks();
    }
  }

  /**
   * Get latest tasks
   */
  public getLatestTasks(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
    this.schedulesService.getLatestTask().subscribe(
      (data) => {
        this.tasksData = data['tasks'];
        if (this.refreshInterval > 0) {
          this.enableRefreshTimer();
        }
      },
      (error) => {
        this.tasksData = [];
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
          if (this.refreshInterval > 0) {
            this.enableRefreshTimer();
          }
        }
      });
  }

  /**
   * Get running tasks
   */
  public getRunningTasks(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
    this.schedulesService.getTasks('RUNNING').subscribe(
    (data) => {
      this.tasksData = data['tasks'];
      if (this.refreshInterval > 0) {
        this.enableRefreshTimer();
      }
    },
    (error) => {
      this.tasksData = [];
      if (error.status === 0) {
        console.log('service down ', error);
      } else {
        this.alertService.error(error.statusText);
        if (this.refreshInterval > 0) {
          this.enableRefreshTimer();
        }
      }
    });
  }

  /**
   *  cancel running task
   * @param id task id
   */
  public cancelRunninTask(id) {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.cancelTask(id).subscribe(
      data => {
      /** request completed */
      this.ngProgress.done();
      if (data['message']) {
        this.alertService.success(data['message'] + ' Wait for few seconds.');
        // TODO: remove cancelled task object from local list
        setTimeout(() => {
          if (this.selectedTaskType === 'Running') {
            this.getRunningTasks();
          } else {
            this.getLatestTasks();
          }
        }, this.REQUEST_TIMEOUT_INTERVAL);
      }
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

  public ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  }
  private enableRefreshTimer(): void {
    this.timerSubscription = Observable.timer(this.refreshInterval)
      .subscribe(
        () => {
          if (this.selectedTaskType === 'Latest') {
            this.getLatestTasks();
          } else {
            this.getRunningTasks();
          }
        });
  }
}
