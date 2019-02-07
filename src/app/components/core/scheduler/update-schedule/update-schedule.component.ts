import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CustomValidator } from '../../../../directives/custom-validator';
import { AlertService, SchedulesService } from '../../../../services';
import Utils from '../../../../utils';

@Component({
  selector: 'app-update-schedule',
  templateUrl: './update-schedule.component.html',
  styleUrls: ['./update-schedule.component.css']
})
export class UpdateScheduleComponent implements OnInit, OnChanges {
  // Default selected schedule type is STARTUP = 1
  public selectedScheduleType: Number = 1;
  // Default selected day index is MONDAY = 1
  public selectedDayIndex: Number = 1;

  public scheduleProcess = [];
  public scheduleType = [];
  public days = [];
  public scheduleName: string;

  @Input() childData: { id: Number, schedule_process: any, schedule_type: any, day: any };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$'; // Regex to verify time format 00:00:00
  form: FormGroup;
  public selectedTypeValue: string;
  constructor(private schedulesService: SchedulesService, public fb: FormBuilder, private alertService: AlertService) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    this.form = this.fb.group({
      name: ['', [CustomValidator.nospaceValidator]],
      repeatDay: ['', [Validators.min(0), Validators.max(365)]],
      repeat: ['', Validators.required],
      exclusive: [Validators.required],
      process_name: [Validators.required],
      type: [Validators.required],
      day: [Validators.required],
      time: [Validators.required, Validators.pattern(this.regExp)],
      enabled: [Validators.required]
    });

    if (changes['childData']) {
      this.scheduleProcess = this.childData.schedule_process;
      this.scheduleType = this.childData.schedule_type;
      this.days = this.childData.day;
    }
    this.getSelectedDayIndex(this.days[0]);
    this.getSchedule(this.childData.id);
  }

  /**
   *  To set schedule type key globally for required field handling on UI
   * @param value
   */
  public setScheduleTypeKey(value) {
    if (value !== undefined) {
      return this.scheduleType.find(object => object.name === value).index;
    }
  }

  getChangedRepeatInterval(event: any) {
    const repeatValue: string = event.target.value;
    if (repeatValue.trim().match(this.regExp)) {
      this.form.controls['repeat'].setErrors(null);
      this.form.patchValue({repeat: repeatValue});
    } else {
      this.form.controls['repeat'].setErrors({ 'invalid': true });
    }
  }

  /**
   * getSelectedDay
   */
  public getSelectedDay(index) {
    let selectedDay;
    if (index == null) {
      selectedDay = 'None';
    } else {
      selectedDay = this.days[index - 1];
    }
    return selectedDay;
  }

  /**
   * getSelectedDay
   */
  public getSelectedDayIndex(day) {
    return this.days.indexOf(day) + 1;
  }

  /**
   * Get schedule
   * @param id to get schedule
   */
  public getSchedule(id): void {
    if (id === undefined) {
      return;
    }

    let scheduleDay;
    this.schedulesService.getSchedule(id).
      subscribe(
        (data) => {
          if (data['type'] === 'TIMED') {
            this.selectedScheduleType = this.setScheduleTypeKey(data['type']);
            scheduleDay = this.getSelectedDay(data['day']);
          } else {
            this.selectedScheduleType = this.setScheduleTypeKey(data['type']);
          }

          const repeatTime = Utils.secondsToDhms(data['repeat']);
          const time = Utils.secondsToDhms(data['time']);

          // used for enable / disable switch only
          this.scheduleName = data['name'].replace(' ', '');
          // Fill form field values
          this.form.patchValue({
            name: data['name'],
            repeatDay: repeatTime.days,
            repeat: repeatTime.time,
            exclusive: data['exclusive'],
            process_name: data['processName'],
            type: data['type'],
            day: scheduleDay,
            time: time.time,
            enabled: data['enabled']
          });
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public toggleModal(isOpen: Boolean) {
    const update_schedule_modal = <HTMLDivElement>document.getElementById('update_schedule_modal');
    if (isOpen) {
      update_schedule_modal.classList.add('is-active');
      return;
    }
    update_schedule_modal.classList.remove('is-active');
  }

  public updateSchedule() {
    if (!this.form.dirty && !this.form.touched) {
      this.toggleModal(false);
      return false;
    }
    const repeatTime = this.form.get('repeat').value !== ('None' || undefined) ? Utils.convertTimeToSec(
      this.form.get('repeat').value, this.form.get('repeatDay').value) : 0;

    this.selectedScheduleType = this.setScheduleTypeKey(this.form.get('type').value);

    let time;
    let dayIndex;
    if (this.selectedScheduleType === 2) {   // If Type is TIMED == 2
      time = Utils.convertTimeToSec(this.form.get('time').value);
      const dayValue = this.form.get('day').value;
      dayIndex = dayValue !== undefined && dayValue !== 'None' ? (this.days.indexOf(this.form.get('day').value) + 1) : '';
    } else {
      this.form.get('day').setValue(0);
      this.form.get('time').setValue(0);
    }

    const updatePayload = {
      'name': this.form.get('name').value,
      'type': this.selectedScheduleType,
      'repeat': repeatTime,
      'day': dayIndex,
      'time': time,
      'exclusive': this.form.get('exclusive').value,
      'enabled': this.form.get('enabled').value
    };

    this.schedulesService.updateSchedule(this.childData.id, updatePayload).
      subscribe(
        () => {
          this.alertService.success('Schedule updated successfully.');
          this.notify.emit();
          this.toggleModal(false);
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }
}
