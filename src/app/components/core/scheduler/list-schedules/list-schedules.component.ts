import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { sortBy } from 'lodash';

import { AlertService, SchedulesService, ProgressBarService } from '../../../../services';
import Utils from '../../../../utils';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';
import { UpdateScheduleComponent } from '../update-schedule/update-schedule.component';

enum weekDays {
  Mon = 1,
  Tue = 2,
  Wed = 3,
  Thu = 4,
  Fri = 5,
  Sat = 6,
  Sun = 7
}

@Component({
  selector: 'app-list-schedules',
  templateUrl: './list-schedules.component.html',
  styleUrls: ['./list-schedules.component.css']
})

export class ListSchedulesComponent implements OnInit {
  public scheduleData = [];
  public scheduleProcess = [];
  public scheduleType = [];
  public days = [];

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @Output() process: EventEmitter<any> = new EventEmitter<any>();
  @Output() type: EventEmitter<any> = new EventEmitter<any>();

  // Object to hold schedule id and name to delete
  public childData = {
    id: 0,
    name: '',
    message: '',
    key: ''
  };
  public updateScheduleData: any;
  @ViewChild(AlertDialogComponent) child: AlertDialogComponent;
  @ViewChild(UpdateScheduleComponent) updateScheduleModal: UpdateScheduleComponent;

  constructor(private schedulesService: SchedulesService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService
  ) { }

  ngOnInit() {

    this.getScheduleType();
    this.getSchedulesProcesses();

    this.days = Object.keys(weekDays).map(key => weekDays[key]).filter(value => typeof value === 'string') as string[];
    this.getSchedules();

    this.updateScheduleData = {
      schedule_process: this.scheduleProcess,
      scheduleType: this.scheduleType,
      day: this.days
    };
  }

  public getSchedulesProcesses(): void {
    this.scheduleProcess = [];
    this.schedulesService.getScheduledProcess().
      subscribe(
        (data) => {
          this.scheduleProcess = data['processes'];
          this.process.emit(this.scheduleProcess);
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public getScheduleType(): void {
    this.schedulesService.getScheduleType().
      subscribe(
        (data) => {
          this.scheduleType = data['scheduleType'];
          this.type.emit(this.scheduleType);
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
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
          data.schedules.forEach(sch => {
            if (!['south_c', 'north_c', 'south', 'north', 'notification_c'].includes(sch.processName)) {
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
   * Get ScheduleProcess from create-schedule.component.ts
   * @param data:  ScheduleProcess record transmitted from
   * child component create-schedule.component.ts
   */
  public setScheduleProcess(data) {
    this.scheduleProcess = data;
  }

  /**
   * Get ScheduleType from create-schedule.component.ts
   * @param data:  ScheduleType record transmitted from
   * child component create-schedule.component.ts
   */
  public setScheduleType(data) {
    this.scheduleType = data;
  }

  /**
   * toggle update modal and pass recod info to update
   * @param id Record id for update
   */
  public editSchedule(id) {
    this.updateScheduleData = {
      id: id,
      schedule_process: this.scheduleProcess,
      schedule_type: this.scheduleType,
      day: this.days
    };
    this.updateScheduleModal.toggleModal(true);
  }

  /**
   * To reload schedule list after deletion of a schedule
   * @param notify
   */
  onNotify() {
    this.getSchedules();
  }

  /**
   * Open delete record modal dialog
   * @param id   schedule id to delete
   * @param name schedule name
   */
  openModal(id, name, message, key) {
    this.childData = {
      id: id,
      name: name,
      message: message,
      key: key
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }

  /**
   *
   * @param index value of the day
   */
  getISODay(index: number) {
    return weekDays[index];
  }
}
