import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, HostListener, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';

import { CustomValidator } from '../../../../directives/custom-validator';
import { AlertService, RolesService, SchedulesService } from '../../../../services';
import Utils, { QUOTATION_VALIDATION_PATTERN } from '../../../../utils';
import { cloneDeep, differenceWith, isEqual, transform, isObject } from 'lodash';
import { Schedule } from '../schedule';

@Component({
  selector: 'app-update-schedule',
  templateUrl: './update-schedule.component.html',
  styleUrls: ['./update-schedule.component.css']
})
export class UpdateScheduleComponent implements OnInit, OnChanges {
  // Default selected schedule type is STARTUP = 1
  public selectedScheduleTypeIndex: Number = 1;
  public selectedScheduleTypeName: string;
  // Default selected day index is MONDAY = 1
  public selectedDayIndex: Number = 1;
  public selectedDayName: string;

  public scheduleProcess = [];
  public scheduleType = [];
  public days = [];
  public scheduleName: string;
  QUOTATION_VALIDATION_PATTERN = QUOTATION_VALIDATION_PATTERN;


  @Input() childData: { id: string, schedule_process: string[], schedule_type: any, day: string[] };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$'; // Regex to verify time format 00:00:00
  form: FormGroup;

  schedule: Schedule;

  constructor(
    private schedulesService: SchedulesService,
    public fb: FormBuilder,
    private alertService: AlertService,
    public rolesService: RolesService) {
    this.form = this.fb.group({
      name: ['', [CustomValidator.nospaceValidator]],
      type: [],
      repeatDay: ['', [Validators.min(0), Validators.max(365)]],
      repeat: ['', Validators.required],
      exclusive: [Validators.required],
      process_name: [Validators.required],
      day: [Validators.required],
      time: ['', Validators.required],
      enabled: [Validators.required]
    });
  }

  ngOnInit() { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.toggleModal(false);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['childData']) {
      this.scheduleProcess = this.childData.schedule_process;
      this.scheduleType = this.childData.schedule_type;
      this.days = this.childData.day;
    }
    this.getSelectedDayIndex(this.days[0]);
    this.getSchedule(this.childData.id);
  }

  ngAfterViewInit() {

  }

  /**
   *  To set schedule type key globally for required field handling on UI
   * @param value
   */
  public setScheduleTypeKey(value: string) {
    this.selectedScheduleTypeName = value;
    if (value !== undefined) {
      return this.scheduleType.find(object => object.name === value).index;
    }
  }

  public toggleDropDown(id: string) {
    const activeDropDowns = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDowns.length > 0) {
      if (activeDropDowns[0].id !== id) {
        activeDropDowns[0].classList.remove('is-active');
      }
    }
    const dropDown = document.querySelector(`#${id}`);
    dropDown.classList.toggle('is-active');
  }

  matchTimeTypeField(event: any, fieldName) {
    const fieldValue: string = event.target.value;
    if (fieldValue.trim().match(this.regExp)) {
      this.form.controls[fieldName].setErrors(null);
      this.form.controls[fieldName].patchValue(fieldValue);
    } else {
      this.form.controls[fieldName].setErrors({ invalid: true });
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
    this.selectedDayName = day;
    return this.days.indexOf(day) + 1;
  }

  /**
   * Get schedule
   * @param id to get schedule
   */
  public getSchedule(id: string): void {
    if (id === undefined) {
      return;
    }
    this.schedulesService.getSchedule(id).
      subscribe(
        (schedule: Schedule) => {
          if (schedule.type === 'TIMED') {
            this.selectedScheduleTypeIndex = this.setScheduleTypeKey(schedule.type);
            this.selectedDayName = this.getSelectedDay(schedule.day);
          } else {
            this.selectedScheduleTypeIndex = this.setScheduleTypeKey(schedule.type);
          }

          const repeatTime = Utils.secondsToDhms(schedule.repeat);
          const time = Utils.secondsToDhms(schedule.time);

          // used for enable / disable switch only
          this.scheduleName = schedule.name.replace(' ', '');
          // Fill form field values
          console.log('type', this.setScheduleTypeKey(schedule.type));

          this.form.patchValue({
            name: schedule.name,
            type: this.setScheduleTypeKey(schedule.type),
            repeatDay: repeatTime.days,
            repeat: repeatTime.time,
            exclusive: schedule.exclusive,
            process_name: schedule.processName,
            day: this.selectedDayName,
            time: time.time,
            enabled: schedule.enabled
          });

          this.schedule = cloneDeep(this.form.getRawValue());
          console.log('schedule', this.schedule);
          console.log('form', this.form.value);

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

    const activeDropDown = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDown.length > 0) {
      activeDropDown[0].classList.remove('is-active');
    }
  }

  getRepeatTime() {
    let repeatTime = 0;
    // If schedule type is Interval
    if (this.selectedScheduleTypeIndex === 2 || this.selectedScheduleTypeIndex === 3) {
      repeatTime = this.form.get('repeat').value !== ('None' || undefined) ? Utils.convertTimeToSec(
        this.form.get('repeat').value, this.form.get('repeatDay').value) : 0;
    }
    return repeatTime;
  }

  difference(currentObj, baseObj) {
    function changes(current, base) {
      return transform(current, function (result, value, key) {
        if (!isEqual(value, base[key])) {
          result[key] = (isObject(value) && isObject(base[key])) ? changes(value, base[key]) : value;
        }
      });
    }
    return changes(currentObj, baseObj);
  }

  public updateSchedule() {
    console.log('form', this.form.value);
    console.log('child', this.schedule);
    if (!this.form.dirty && !this.form.touched) {
      this.toggleModal(false);
      return false;
    }
    let payload: Schedule;
    if (this.schedule.type === 1) {
      payload = this.difference(this.form.value, this.schedule);
      console.log('diff', payload);
    } else {
      const repeatTime = this.getRepeatTime();
      this.selectedScheduleTypeIndex = this.setScheduleTypeKey(this.selectedScheduleTypeName);
      let time = 0;
      let dayIndex = 0;
      if (this.selectedScheduleTypeIndex === 2) {   // If Type is TIMED == 2
        time = Utils.convertTimeToSec(this.form.get('time').value);
        const dayValue = this.selectedDayName;
        dayIndex = dayValue !== undefined && dayValue !== 'None' ? (this.days.indexOf(this.selectedDayName) + 1) : 0;
        // difference.day = dayIndex;
        // difference.time = time;
      }
      // difference.day = time;
      // difference.time = dayIndex;
      // difference.repeat = repeatTime;
      // difference.type = this.selectedScheduleTypeIndex;
      payload = {
        name: this.form.get('name').value,
        type: this.selectedScheduleTypeIndex,
        repeat: repeatTime,
        day: dayIndex,
        time: time,
        exclusive: this.form.get('exclusive').value,
        enabled: this.form.get('enabled').value
      };
    }




    this.schedulesService.updateSchedule(this.childData.id, payload).
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
