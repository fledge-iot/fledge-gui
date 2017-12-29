import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { SchedulesService, AlertService } from '../services/index';
import Utils from '../utils';
import { CustomValidator } from '../directives/custom-validator';

@Component({
  selector: 'app-update-modal',
  templateUrl: './update-modal.component.html',
  styleUrls: ['./update-modal.component.css']
})
export class UpdateModalComponent implements OnInit, OnChanges {
  // Default selected schedule type is STARTUP = 1
  public selected_schedule_type: Number = 1;

  // Default selected day index is MONDAY = 1
  public selected_day_index: Number = 1;
  public scheduleProcess = [];
  public scheduleType = [];
  public days = [];

  @Input() childData: { id: Number, schedule_process: any, schedule_type: any, day: any };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  form: FormGroup;
  public selectedTypeValue: string;
  constructor(private schedulesService: SchedulesService, public fb: FormBuilder, private alertService: AlertService) { }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {
    let regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$'  // Regex to varify time format 00:00:00
    this.form = this.fb.group({
      name: ['', [CustomValidator.nospaceValidator]],
      repeatDay: ['', [Validators.min(0), Validators.max(365)]],
      repeat: ['', [Validators.required, Validators.pattern(regExp)]],
      exclusive: [Validators.required],
      process_name: [Validators.required],
      type: [Validators.required],
      day: [Validators.required],
      time: ['', [Validators.required, Validators.pattern(regExp)]],
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
    if (value != undefined) {
      return this.scheduleType.find(object => object.name == value).index;
    }
  }

  /**
   * getSelectedDay
   */
  public getSelectedDay(index) {
    let selected_day = this.days[index - 1];
    return selected_day;
  }

  /**
   * getSelectedDay
   */
  public getSelectedDayIndex(day) {
    let day_index = this.days.indexOf(day) + 1;
    return day_index;
  }

  /**
   * Get schedule
   * @param id to get schedule
   */
  public getSchedule(id): void {
    if (id == undefined) {
      return;
    }

    let schedule_day;
    this.schedulesService.getSchedule(id).
      subscribe(
      data => {
        if (data.error) {
          this.alertService.error(data.error.message);
          return;
        }
        if (data.type == 'TIMED') {
          this.selected_schedule_type = this.setScheduleTypeKey(data.type);
          schedule_day = this.getSelectedDay(data.day);
        } else {
          this.selected_schedule_type = this.setScheduleTypeKey(data.type);
        }

        let repeatTimeObj = Utils.secondsToDhms(data.repeat);
        let timeObj = Utils.secondsToDhms(data.time);

        // Fill form field values
        this.form.patchValue({
          name: data.name,
          repeatDay: repeatTimeObj.days,
          repeat: repeatTimeObj.time,
          exclusive: data.exclusive,
          process_name: data.processName,
          type: data.type,
          day: schedule_day,
          time: timeObj.time
        });
      },
      error => { console.log('error', error); });
  }

  public toggleModal(isOpen: Boolean) {
    let update_schedule_modal = <HTMLDivElement>document.getElementById('update_schedule_modal');
    if (isOpen) {
      update_schedule_modal.classList.add('is-active');
      return;
    }
    update_schedule_modal.classList.remove('is-active');
  }

  public updateSchedule() {
    let RepeatTime = this.form.get('repeat').value != ('None' || undefined) ? Utils.convertTimeToSec(
      this.form.get('repeat').value, this.form.get('repeatDay').value) : 0;

    this.selected_schedule_type = this.setScheduleTypeKey(this.form.get('type').value);
    this.form.controls['type'].setValue(this.selected_schedule_type);

    let time; 
    if (this.form.get('type').value == '2') {   // If Type is TIMED == 2
      time = Utils.convertTimeToSec(this.form.get('time').value);
      let index = this.form.get('day').value != undefined ? this.days.indexOf(this.form.get('day').value) : 0;
      this.form.controls['day'].setValue(index + 1);
    } else {
      this.form.get('day').setValue(0);
      this.form.get('time').setValue(0);
    }

    let updatePayload = {
      'name': this.form.get('name').value,
      'process_name': this.form.get('process_name').value,
      'type': this.form.get('type').value,
      'repeat': RepeatTime,
      'day': this.form.get('day').value,
      'time': time,
      'exclusive': this.form.get('exclusive').value,
    };

    this.schedulesService.updateSchedule(this.childData.id, updatePayload).
      subscribe(
      data => {
        if (data.error) {
          console.log('error in response', data.error);
          this.alertService.error(data.error.message);
        } else {
          this.alertService.success('Schedule updated successfully.');
        }
        this.notify.emit();
        this.toggleModal(false);

      },
      error => { console.log('error', error); });
  }
}
