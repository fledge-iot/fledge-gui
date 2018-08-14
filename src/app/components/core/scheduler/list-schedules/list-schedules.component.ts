import { Component, OnInit, ViewChild } from '@angular/core';
import { EventEmitter, Output } from '@angular/core';
import { SchedulesService, AlertService } from '../../../../services/index';
import { UpdateScheduleComponent } from '../update-schedule/update-schedule.component';
import Utils from '../../../../utils';
import { NgProgress } from 'ngx-progressbar';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';
import { sortBy, reverse } from 'lodash';

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
  public scheduler_name: string;

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

  constructor(private schedulesService: SchedulesService, private alertService: AlertService, public ngProgress: NgProgress) { }

  ngOnInit() {

    this.getScheduleType();
    this.getSchedulesProcesses();

    this.days = Object.keys(weekDays).map(key => weekDays[key]).filter(value => typeof value == 'string') as string[];
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
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.scheduleData = data['schedules'];
          this.scheduleData.forEach(element => {
            const repeatTimeObj = Utils.secondsToDhms(element.repeat);
            if (repeatTimeObj.days == 1) {
              element.repeat = repeatTimeObj.days + ' day, ' + repeatTimeObj.time;
            } else if (repeatTimeObj.days > 1) {
              element.repeat = repeatTimeObj.days + ' days, ' + repeatTimeObj.time;
            } else {
              element.repeat = repeatTimeObj.time;
            }
            // Time
            element.time = Utils.secondsToDhms(element.time).time;
          });
          // sort by enabled and then (TODO) by name
          this.scheduleData = sortBy(this.scheduleData, ['enabled']).reverse()
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

  /**
   * Disable schedule
   * @param schedule_id id of the schedule to disable
   */
  public disableSchedule(schedule_id) {
    console.log('Disabling Schedule:', schedule_id);
    /** request started */
    this.ngProgress.start();
    this.schedulesService.disableSchedule(schedule_id).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          const schedule = this.scheduleData.find(item => item.id === schedule_id);
          if (data['status'] === true) {
            schedule.enabled = false;
          }
          this.alertService.success(data['message']);
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
   * Enable schedule
   * @param schedule_id id of the schedule to enable
   */
  public enableSchedule(schedule_id) {
    console.log('Enabling Schedule:', schedule_id);
    /** request started */
    this.ngProgress.start();
    this.schedulesService.enableSchedule(schedule_id).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          const schedule = this.scheduleData.find(item => item.id === schedule_id);
          if (data['status'] === true) {
            schedule.enabled = true;
          }
          this.alertService.success(data['message']);
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
   * Delete schedule
   * @param schedule_id id of the schedule to delete
   */
  deleteSchedule(schedule_id) {
    console.log('Deleting Schedule:', schedule_id);
    /** request started */
    this.ngProgress.start();
    this.schedulesService.deleteSchedule(schedule_id).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data['message']);
          this.getSchedules();
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

}
