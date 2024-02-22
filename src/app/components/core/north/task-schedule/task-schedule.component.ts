
import { Component, EventEmitter, Input, ViewChild } from '@angular/core';
import { AlertService, ProgressBarService, RolesService, SchedulesService } from '../../../../services';
import Utils from '../../../../utils';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-task-schedule',
  templateUrl: './task-schedule.component.html',
  styleUrls: ['./task-schedule.component.css']
})
export class TaskScheduleComponent {
  @Input() taskSchedule = { id: '', name: '', exclusive: false, repeatTime: '', repeatDays: 0 };
  public reenableButton = new EventEmitter<boolean>(false);
  regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$';
  @ViewChild('fg') ngForm: NgForm;
  constructor(
    public rolesService: RolesService,
    private schedulesService: SchedulesService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
  ) { }


  getTimeIntervalValue(event) {
    this.taskSchedule.repeatTime = event.target.value;
  }

  updateTaskSchedule(data: any) {
    let repeat = 0;
    if (data.repeatTime) {
      repeat = Utils.convertTimeToSec(data.repeatTime, data.repeatDays);
    }

    const payload = {
      repeat,
      exclusive: data.exclusive
    }
    this.ngProgress.start();
    this.schedulesService.updateSchedule(this.taskSchedule.id, payload)
      .subscribe(
        () => {
          this.reenableButton.emit(false)
          this.alertService.success('Schedule updated successfully', true);
          this.ngProgress.done();
          this.ngForm.form.markAsUntouched();

        },
        error => {
          this.reenableButton.emit(false);
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText, true);
          }
        });
  }
}
