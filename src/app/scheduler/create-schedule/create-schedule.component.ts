import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { SchedulesService, AlertService } from '../../services/index';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import Utils from '../../utils';
import { CustomValidator } from '../../directives/custom-validator';

@Component({
  selector: 'app-create-schedule',
  templateUrl: './create-schedule.component.html',
  styleUrls: ['./create-schedule.component.css']
})
export class CreateScheduleComponent implements OnInit {
  form: FormGroup;

  // variable to hold schedular name for data binding in DOM
  public scheduler_name;

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @Output() process: EventEmitter<any> = new EventEmitter<any>();
  @Output() type: EventEmitter<any> = new EventEmitter<any>();

  public scheduleProcess = [];
  public scheduleType = [];
  public selected_schedule_type = 1;
  public typeIndex; // to hold schedule type index in html 
  constructor(private schedulesService: SchedulesService, private alertService: AlertService, public formBuilder: FormBuilder) { }

  ngOnInit() {
    this.getScheduleType();
    this.getSchedulesProcesses();
    let regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$'  // Regex to varify time format 00:00:00
    this.form = this.formBuilder.group({
      name: ['', [CustomValidator.nospaceValidator]],
      repeatDay: [Validators.min(0), Validators.max(365)],
      repeatTime: ['', [Validators.required, Validators.pattern(regExp)]],
      exclusive: [Validators.required],
      processName: [Validators.required],
      type: [Validators.required],
      day: [Validators.required],
      time: ['', [Validators.required, Validators.pattern(regExp)]],
    });

    // disable time and day field to bypass required validation   
    this.form.get('day').disable();
    this.form.get('time').disable();

    // Set default values on form
    this.form.get('type').setValue(1);
    this.form.get('exclusive').setValue(true);
    this.form.get('day').setValue(1);
  }

  public toggleModal(isOpen: Boolean) {
    let schedule_name = <HTMLDivElement>document.getElementById('create_schedule_modal');
    if (isOpen) {
      schedule_name.classList.add('is-active');
      return;
    }
    schedule_name.classList.remove('is-active');
    this.form.reset({ exclusive: true, processName: this.scheduleProcess[0], type: 1, repeatTime: 'hh:mm:ss', day: 1, time: 'hh:mm:ss' });
    this.selected_schedule_type = 1; // reset to default
    this.form.get('day').disable();
    this.form.get('time').disable();
  }


  public createSchedule() {
    if (this.form.valid) {
      // total time with days and hh:mm:ss
      let RepeatTime = this.form.get('repeatTime').value != ('' || undefined) ? Utils.convertTimeToSec(
        this.form.get('repeatTime').value, this.form.get('repeatDay').value) : 0;

      let time;
      if (this.form.get('type').value == '2') {   // If Type is TIMED == 2
        time = this.form.get('time').value.length != 0 ? Utils.convertTimeToSec(this.form.get('time').value) : 0;
      } else {
        this.form.get('day').setValue(0);
        time = 0;
      }

      let payload = {
        'name': this.form.get('name').value,
        'process_name': this.form.get('processName').value,
        'type': this.form.get('type').value,
        'repeat': RepeatTime,
        'day': this.form.get('day').value,
        'time': time,
        'exclusive': this.form.get('exclusive').value,
      };

      this.schedulesService.createSchedule(payload).
        subscribe(
        data => {
          if (data.error) {
            console.log('error in response', data.error);
            this.alertService.error(data.error.message);
            return;
          }
          this.notify.emit();
          this.toggleModal(false);
          this.alertService.success('Schedule created successfully.');
        },
        error => { console.log('error', error); });
    } else {
      CustomValidator.validateAllFormFields(this.form);
    }
  }

  /**
   *  To set schedule type key globally for required field handling on UI
   * @param value
   */
  public setScheduleTypeKey() {
    // enable, disable time and date field on schedule type change 
    if (this.form.get('type').value == 2) {
      this.form.get('day').enable();
      this.form.get('time').enable();
    } else {
      this.form.get('day').disable();
      this.form.get('time').disable();
    }
    return this.form.get('type').value;
  }

  public getSchedulesProcesses(): void {
    this.scheduleProcess = [];
    this.schedulesService.getScheduledProcess().
      subscribe(
      data => {
        if (data.error) {
          this.alertService.error(data.error.message);
          return;
        }
        this.scheduleProcess = data.processes;
        this.form.get('processName').setValue(this.scheduleProcess[0])
        console.log('This is the getScheduleProcess ', this.scheduleProcess);
        this.process.emit(this.scheduleProcess);
      },
      error => { console.log('error', error); });
  }

  public getScheduleType(): void {
    this.schedulesService.getScheduleType().
      subscribe(
      data => {
        if (data.error) {
          this.alertService.error(data.error.message);
          return;
        }
        this.scheduleType = data.scheduleType;
        console.log(this.scheduleType);
        this.type.emit(this.scheduleType);
      },
      error => { console.log('error', error); });
  }
}
