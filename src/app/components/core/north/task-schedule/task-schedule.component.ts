
import { Component, EventEmitter, Input } from '@angular/core';
import { AlertService, ProgressBarService, RolesService, SchedulesService } from '../../../../services';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import Utils from '../../../../utils';

@Component({
  selector: 'app-task-schedule',
  templateUrl: './task-schedule.component.html',
  styleUrls: ['./task-schedule.component.css']
})
export class TaskScheduleComponent {

  @Input() taskSchedule = { id: '', name: '', exclusive: false, repeatTime: '', repeatDays: 0 };
  public reenableButton = new EventEmitter<boolean>(false);
  regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$';
  constructor(
    public rolesService: RolesService,
    private dialogService: DialogService,
    private schedulesService: SchedulesService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
  ) { }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

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
          this.closeModal('update-task-schedule-dialog');
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
          this.closeModal('update-task-schedule-dialog');
        });
  }
}
