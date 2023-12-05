import { Component, OnInit, HostListener, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CustomValidator } from '../../../../directives/custom-validator';
import { AlertService, RolesService, SchedulesService } from '../../../../services';
import Utils, { QUOTATION_VALIDATION_PATTERN, weekDays } from '../../../../utils';
import { cloneDeep, isEmpty } from 'lodash';
import { Schedule } from '../schedule';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-update-schedule',
  templateUrl: './update-schedule.component.html',
  styleUrls: ['./update-schedule.component.css']
})
export class UpdateScheduleComponent implements OnInit {
  public scheduleTypes = [];
  public days = [];
  QUOTATION_VALIDATION_PATTERN = QUOTATION_VALIDATION_PATTERN;
  regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$'; // Regex to verify time format 00:00:00
  form: FormGroup;

  schedule: Schedule;
  scheduleId: string;

  public reenableButton = new EventEmitter<boolean>(false);

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
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

    this.activatedRoute.data.subscribe(result => {
      this.scheduleId = result.data.id;
      this.scheduleTypes = result.data.scheduleTypes;
      if (this.scheduleId) {
        this.getWeekDays();
        this.getSchedule(this.scheduleId);
      }
    })
  }

  ngOnInit() { }

  public getWeekDays() {
    // convert enum to array;
    const days = Object.keys(weekDays).map(key => weekDays[key]).filter(value => typeof value === 'string') as string[];
    this.days = days.map((day, index) => (day == 'None' ? { index: 0, name: day } : { index: index, name: day }));
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.navToSchedulesPage();
  }

  setScheduleType(type: any) {
    this.form.controls['type'].patchValue(type);
    this.form.controls['type'].updateValueAndValidity();

    if (type.name == 'TIMED') {
      const time = Utils.convertTimeToSec(this.form.get('time').value);
      // Set time control value when type is TIMED 
      if (time == 0) { this.form.controls['time'].patchValue('00:00:01') }
    }

    // Enable repeat & time control 
    this.form.controls['time'].enable();
    this.form.controls['day'].enable();
    this.form.controls['repeat'].enable();
    this.form.controls['repeatDay'].enable();

    if (['MANUAL', 'STARTUP'].includes(type.name)) {
      // Disable repeat & time control
      this.form.controls['time'].disable();
      this.form.controls['day'].disable();
      this.form.controls['repeat'].disable();
      this.form.controls['repeatDay'].disable();
    }

    if (type.name == 'INTERVAL') {
      // Disable time control
      this.form.controls['time'].disable();
      this.form.controls['day'].disable();
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

  public setDayByIndex(index: number) {
    // if day is null
    index = index ? index : 0;
    const day = this.days.find(day => day.index == index);
    this.form.controls['day'].patchValue(day);
    this.form.controls['day'].updateValueAndValidity();
    // set default time 
    this.form.controls['time'].patchValue('00:00:01');
    this.form.controls['time'].updateValueAndValidity();
    return day;
  }

  setDay(day: string) {
    this.form.controls['day'].patchValue(day);
    this.form.controls['day'].updateValueAndValidity();
  }

  /**
   * Get schedule
   * @param id to get schedule
   */
  public getSchedule(id: string): void {
    this.schedulesService.getSchedule(id)
      .subscribe(
        (schedule: Schedule) => {
          const repeatTime = Utils.secondsToDhms(schedule.repeat);
          const time = Utils.secondsToDhms(schedule.time);
          this.form.patchValue({
            name: schedule.name,
            type: this.scheduleTypes?.find(t => t.name === schedule.type),
            repeatDay: repeatTime.days,
            repeat: repeatTime.time,
            exclusive: schedule.exclusive,
            processName: schedule.processName,
            day: schedule.type == 'TIMED' ? this.setDayByIndex(schedule.day) : { index: 0, name: 'None' },
            time: time.time,
            enabled: schedule.enabled
          });

          this.schedule = cloneDeep(this.form.getRawValue());
          this.toggleModal(true);
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText, true);
          }
          this.navToSchedulesPage();
        });
  }


  compareSelectItem(item, selected) {
    return item?.name === selected?.name;
  }

  scheduleType() {
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
    if (['TIMED', 'INTERVAL'].includes(this.scheduleType())) {
      repeatTime = this.form.get('repeat').value !== ('None' || undefined) ? Utils.convertTimeToSec(
        this.form.get('repeat').value, this.form.get('repeatDay').value) : 0;
    }
    return repeatTime;
  }

  public updateSchedule() {
    if (!this.form.dirty && this.form.pristine) {
      this.navToSchedulesPage();
      return false;
    }
    let payload: Schedule = Utils.difference(this.form.value, this.schedule);

    if ('type' in payload) {
      payload.type = payload.type.index;
    }

    if (payload.hasOwnProperty('repeat') || payload.hasOwnProperty('repeatDay')) {
      payload.repeat = this.getRepeatTime();
      delete payload.repeatDay;
    }

    if ('time' in payload) {
      payload.time = Utils.convertTimeToSec(this.form.get('time').value);
    }

    if ('day' in payload) {
      payload.day = payload?.day.index == 0 ? '' : payload?.day.index;
    }

    // no change in the form
    if (isEmpty(payload)) {
      this.navToSchedulesPage();
      return false;
    }

    this.schedulesService.updateSchedule(this.scheduleId, payload).
      subscribe(
        () => {
          this.reenableButton.emit(false);
          this.alertService.success('Schedule updated successfully.', true);
          this.navToSchedulesPage();
        },
        error => {
          this.reenableButton.emit(false);
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText, true);
            this.navToSchedulesPage();
          }
        });
  }

  navToSchedulesPage() {
    this.router.navigate(['schedules']);
  }
}
