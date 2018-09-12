import { Component, OnInit, OnDestroy } from '@angular/core';
import { sortBy } from 'lodash/sortBy';
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
  public refreshInterval = POLLING_INTERVAL;
  private timerSubscription: AnonymousSubscription;
  private REQUEST_TIMEOUT_INTERVAL = 5000;

  constructor(
    private schedulesService: SchedulesService,
    private alertService: AlertService,
    public ngProgress: NgProgress,
    private ping: PingService
  ) { }

  ngOnInit() {
    this.getLatestTasks();
    this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
      this.refreshInterval = timeInterval;
    });
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
        const taskData = data['tasks'];
        let runningTasks = taskData.filter((rt => (rt.state === 'Running')));
        runningTasks = sortBy(runningTasks, function (obj) {
          return !obj.startTime;
        });
        let completedTasks = taskData.filter((ct => (ct.state === 'Complete')));
        completedTasks = sortBy(completedTasks, function (obj) {
          return !obj.endTime;
        });
        const otherTasks = taskData.filter((td => (td.state !== 'Running' && td.state !== 'Complete')));

        this.tasksData = runningTasks.reverse().concat(completedTasks.reverse(), otherTasks.reverse());

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
  public cancelRunningTask(id) {
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
            this.getLatestTasks();
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
          this.getLatestTasks();
        });
  }
}
