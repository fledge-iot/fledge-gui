import { Component, OnInit } from '@angular/core';
import { sortBy } from 'lodash';

import { AlertService, SchedulesService, ProgressBarService, RolesService } from '../../../../services';
import Utils, { weekDays } from '../../../../utils';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list-schedules',
  templateUrl: './list-schedules.component.html',
  styleUrls: ['./list-schedules.component.css']
})

export class ListSchedulesComponent implements OnInit {
  public scheduleData = [];
  constructor(
    private schedulesService: SchedulesService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    public rolesService: RolesService,
    public router: Router
  ) { }

  ngOnInit() {
    this.getSchedules();
  }

  public getSchedules(): void {
    this.scheduleData = [];
    /** request started */
    this.ngProgress.start();
    this.schedulesService.getSchedules().
      subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          /**
           * Services ignored to filter
           *
           * backup - backup hourly and, backup on demand service
           * certificate checker - Certificate checker service
           * dispatcher_c - The Dispatcher service
           * notification_c - The Notification service
           * purge - Purge service
           * purge_system : Purge System service
           * restore - Restore on demand service
           * stats collection - Stats collection service
           * management : Management service
           *
           */
          data.schedules.forEach(sch => {
            if (!['south_c', 'north_c', 'north_C', 'south', 'north', 'notification_c', 'automation_script'].includes(sch.processName)) {
              this.scheduleData.push(sch);
            }
          });
          this.scheduleData.forEach(element => {
            const repeatTimeObj = Utils.secondsToDhms(element.repeat);
            if (repeatTimeObj.days === 1) {
              element.repeat = repeatTimeObj.days + ' day, ' + repeatTimeObj.time;
            } else if (repeatTimeObj.days > 1) {
              element.repeat = repeatTimeObj.days + ' days, ' + repeatTimeObj.time;
            } else {
              element.repeat = repeatTimeObj.time;
            }
            element.time = Utils.secondsToDhms(element.time).time;
            element.dayName = element.day ? weekDays[element.day] : 'None';
          });
          this.scheduleData = sortBy(this.scheduleData, function (obj) {
            return !obj.enabled + obj.name.toLowerCase();
          });
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

  /**
   * toggle update modal and pass recod info to update
   * @param id Record id for update
   */
  public openEditSchedulePage(id: string) {
    this.router.navigate(['/schedules', id]);
  }

  /**
   * To reload schedule list after deletion of a schedule
   * @param notify
   */
  onNotify() {
    this.getSchedules();
  }

  /**
   *
   * @param index value of the day
   */
  getISODay(index: number) {
    return weekDays[index];
  }
}
