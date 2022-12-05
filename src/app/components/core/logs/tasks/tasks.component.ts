import { Component, OnDestroy, OnInit } from '@angular/core';
import { sortBy } from 'lodash';
import { interval, Subject, Subscription } from 'rxjs';
import { takeWhile, takeUntil } from 'rxjs/operators';

import { AlertService, PingService, SchedulesService, ProgressBarService, RolesService } from '../../../../services';
import { POLLING_INTERVAL } from '../../../../utils';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit, OnDestroy {
  public tasksData = [];
  public refreshInterval = POLLING_INTERVAL;
  private REQUEST_TIMEOUT_INTERVAL = 5000;
  isAlive: boolean;
  destroy$: Subject<boolean> = new Subject<boolean>();
  private subscription: Subscription;

  constructor(
    private schedulesService: SchedulesService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    private ping: PingService,
    public rolesService: RolesService
  ) {
    this.isAlive = true;
    this.ping.pingIntervalChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((timeInterval: number) => {
        if (timeInterval === -1) {
          this.isAlive = false;
        }
        this.refreshInterval = timeInterval;
      });
  }

  ngOnInit() {
    this.getLatestTasks();
    this.subscription = interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        this.getLatestTasks();
      });
  }

  /**
   * Get latest tasks
   */
  public getLatestTasks(): void {
    this.schedulesService.getLatestTask()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
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
        },
        (error) => {
          this.tasksData = [];
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
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
    this.schedulesService.cancelTask(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
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

  toggleAutoRefresh(event: any) {
    this.isAlive = event.target.checked;
    // clear interval subscription before initializing it again
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    /**
     * Set refresh interval to default if Auto Refresh checked and
     * pingInterval is set to manual on settings page
     * */
    if (this.isAlive && this.refreshInterval === -1) {
      this.refreshInterval = POLLING_INTERVAL;
    }
    this.subscription = interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        this.getLatestTasks();
      });
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    this.subscription.unsubscribe();
  }
}
