import { Component, OnInit } from '@angular/core';
import { SchedulesService, AlertService } from '../../services/index';
import { NgProgress } from 'ngx-progressbar';

@Component({
  selector: 'app-list-tasks',
  templateUrl: './list-tasks.component.html',
  styleUrls: ['./list-tasks.component.css']
})
export class ListTasksComponent implements OnInit {
  public tasksData = [];
  public selectedTaskType = 'Latest'; // Default is LATEST

  constructor(private schedulesService: SchedulesService, private alertService: AlertService, public ngProgress: NgProgress) {}

  ngOnInit() {
    this.getLatestTasks();
  }

  /**
   * Get tasks by state {RUNNING, LATEST}
   * @param state Task state
   */
  public getTasks(state) {
    if (state.toUpperCase() == 'RUNNING') {
      this.selectedTaskType = 'Running';
      this.getRunningTasks();
      return;
    }
    this.selectedTaskType = 'Latest';
    this.getLatestTasks();
  }

  /**
   * Get latest tasks
   */
  public getLatestTasks(): void {
    this.tasksData = [];
    /** request started */
    this.ngProgress.start();
    this.schedulesService.getLatestTask().
      subscribe(
      data => {
        /** request completed */
        this.ngProgress.done();
        if (data.error) {
          this.alertService.error(data.error.message);
          return;
        }
        this.tasksData = data.tasks;
        console.log('Latest tasks ', data.tasks);
      },
      error => {
        /** request completed */
        this.ngProgress.done();
        console.log('error', error);
      });
  }

  /**
   * Get running tasks
   */
  public getRunningTasks(): void {
    this.tasksData = [];
    /** request started */
    this.ngProgress.start();
    this.schedulesService.getTasks('RUNNING').
      subscribe(
      data => {
        /** request completed */
        this.ngProgress.done();
        if (data.error) {
          this.alertService.error(data.error.message);
        }
        this.tasksData = data.tasks;
        console.log('Running tasks ', this.tasksData);
      },
      error => {
        /** request completed */
        this.ngProgress.done();
        console.log('error', error);
      });
  }

  /**
   *  cancel running task
   * @param id task id
   */
  public cancelRunninTask(id) {
    console.log('Task UUID:', id);
    /** request started */
    this.ngProgress.start();
    this.schedulesService.cancelTask(id).
      subscribe(
      data => {
        /** request completed */
        this.ngProgress.done();
        if (data.error) {
          this.alertService.error(data.error.message);
        }
        if (data.message) {
          this.alertService.success(data.message + ' Wait for 5 seconds!');
          // TODO: remove cancelled task object from local list
          setTimeout(() => {
            console.log('waiting...', this.selectedTaskType);
            if (this.selectedTaskType == 'Running') {
              this.getRunningTasks();
            } else {
              this.getLatestTasks();
            }
          }, 5000);
        }
      },
      error => {
        /** request completed */
        this.ngProgress.done();
        console.log('error', error);
      });
  }
}
