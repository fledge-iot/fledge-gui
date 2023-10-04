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
  //public selectedScheduleTypeIndex: Number = 1;
  //public selectedScheduleTypeName: string;
  // Default selected day index is MONDAY = 1
  //public selectedDayIndex: Number = 1;
  //public selectedDayName: string;

  //public scheduleProcess = [];
  public scheduleTypes = [];
  public days = [];
  //public scheduleName: string;
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
      name: [, [CustomValidator.nospaceValidator]],
      type: [, Validators.required],
      repeatDay: [0, [Validators.min(0), Validators.max(365)]],
      repeat: [0, Validators.required],
      exclusive: [false, Validators.required],
      processName: [],
      day: [0, Validators.required],
      time: [0, Validators.required],
      enabled: [false, Validators.required]
    });
  }

  ngOnInit() { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.toggleModal(false);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['childData']) {
      this.scheduleTypes = this.childData.schedule_type;
      this.days = this.childData.day.map((day, index) => (day == 'None' ? { index: 0, name: day } : { index: index + 1, name: day }));
      console.log(this.days);
    }
    this.getSchedule(this.childData.id);
  }

  ngAfterViewInit() {

  }

  setScheduleType(type) {
    console.log('type', type);
    this.form.controls['type'].patchValue(type);
    this.form.controls['type'].updateValueAndValidity();
    if (type.name == 'TIMED') {
      this.setDayByIndex(0)
    }
  }

  /**
   *  To set schedule type key globally for required field handling on UI
   * @param value
   */
  public setScheduleTypeKey(value: string) {
    //this.selectedScheduleTypeName = value;
    if (value !== undefined) {
      return this.scheduleTypes.find(object => object.name === value).index;
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
  public setDayByIndex(index: number) {
    // if day == null  
    index = index ? index : 0;
    const day = this.days.find(day => day.index == index);
    this.form.controls['day'].patchValue(day);
    this.form.controls['day'].updateValueAndValidity();
    return day;
  }

  setDay(day) {
    this.form.controls['day'].patchValue(day);
    this.form.controls['day'].updateValueAndValidity();
  }

  /**
   * getSelectedDay
   */
  public getSelectedDayIndex(day) {
    //this.selectedDayName = day;
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
          const repeatTime = Utils.secondsToDhms(schedule.repeat);
          const time = Utils.secondsToDhms(schedule.time);
          // this.form = this.fb.group({
          //   name: [schedule.name, [CustomValidator.nospaceValidator]],
          //   type: [schedule.type, Validators.required],
          //   repeatDay: [repeatTime.days, [Validators.min(0), Validators.max(365)]],
          //   repeat: [repeatTime.time, Validators.required],
          //   exclusive: [schedule.exclusive, Validators.required],
          //   process_name: [schedule.processName],
          //   day: [this.getSelectedDay(schedule.day), Validators.required],
          //   time: [time.time, Validators.required],
          //   enabled: [schedule.enabled, Validators.required]
          // });

          this.form.patchValue({
            name: schedule.name,
            type: this.scheduleTypes.find(t => t.name === schedule.type),
            repeatDay: repeatTime.days,
            repeat: repeatTime.time,
            exclusive: schedule.exclusive,
            processName: schedule.processName,
            day: schedule.type == 'TIMED' ? this.setDayByIndex(schedule.day) : 0,
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

  compareType(item, selected) {
    return item?.name === selected?.name
  }

  compareDay(item, selected) {
    return item?.name === selected?.name;
  }

  getScheduleType() {
    return this.form?.controls['type']?.value?.name;
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
    if (this.getScheduleType() === 'TIMED' || this.getScheduleType() === 'INTERVAL') {
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
    let payload: Schedule = this.difference(this.form.value, this.schedule);

    if ('type' in payload) {
      payload.type = payload.type.index;
    }

    if (Object.keys(payload).some(key => payload.hasOwnProperty(key))) {
      payload.repeat = this.getRepeatTime();
      delete payload.repeatDay;
    }

    if ('time' in payload) {
      payload.time = Utils.convertTimeToSec(this.form.get('time').value);
    }

    if ('day' in payload) {
      payload.day = payload?.day.index == 0 ? 'None' : payload?.day.index;
    }
    console.log('diff', payload);
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
            this.notify.emit();
            this.toggleModal(false);
          }
        });
  }
}


