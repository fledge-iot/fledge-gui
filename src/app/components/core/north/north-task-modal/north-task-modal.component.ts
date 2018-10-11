import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { isEmpty } from 'lodash';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, ConfigurationService, SchedulesService } from '../../../../services';
import Utils from '../../../../utils';
import { ViewConfigItemComponent } from '../../configuration-manager/view-config-item/view-config-item.component';

@Component({
  selector: 'app-north-task-modal',
  templateUrl: './north-task-modal.component.html',
  styleUrls: ['./north-task-modal.component.css']
})
export class NorthTaskModalComponent implements OnInit, OnChanges {
  category: any;
  useProxy: 'true';

  enabled: Boolean;
  exclusive: Boolean;
  repeatTime: any;
  repeatDays: any;
  name: string;

  form: FormGroup;
  regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$';
  @Input()
  task: { task: any };

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild(ViewConfigItemComponent) viewConfigItemComponent: ViewConfigItemComponent;

  constructor(
    private schedulesService: SchedulesService,
    private configService: ConfigurationService,
    private alertService: AlertService,
    public fb: FormBuilder,
    public ngProgress: NgProgress,
  ) { }

  ngOnInit() { }

  ngOnChanges() {
    if (this.task !== undefined) {
      this.getCategory();
    }

    this.form = this.fb.group({
      repeatDays: [''],
      repeatTime: ['', Validators.required],
      exclusive: [Validators.required],
      enabled: [Validators.required]
    });
  }

  public toggleModal(isOpen: Boolean) {
    const modal = <HTMLDivElement>document.getElementById('north-task-modal');
    if (isOpen) {
      this.notify.emit(false);
      modal.classList.add('is-active');
      return;
    }
    this.notify.emit(true);
    modal.classList.remove('is-active');
  }

  public getCategory(): void {
    /** request started */
    this.ngProgress.start();
    this.enabled = this.task['enabled'];
    this.exclusive = this.task['exclusive'];
    const repeatInterval = Utils.secondsToDhms(this.task['repeat']);
    this.repeatTime = repeatInterval.time;
    this.repeatDays = repeatInterval.days;
    this.name = this.task['name'];
    const categoryValues = [];
    this.configService.getCategory(this.name).subscribe(
      (data: any) => {
        if (!isEmpty(data)) {
          categoryValues.push(data);
          this.category = { key: this.name, value: categoryValues };
          this.useProxy = 'true';
        }
        /** request completed */
        this.ngProgress.done();
      },
      error => {
        /** request completed */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText, true);
        }
      }
    );
  }

  public hideNotification() {
    const deleteBtn = <HTMLDivElement>document.getElementById('delete');
    deleteBtn.parentElement.classList.add('is-hidden');
    return false;
  }

  public saveScheduleFields(form: NgForm) {
    if (!form.dirty && !form.touched) {
      this.toggleModal(false);
      return false;
    }

    if (!form.valid) {
      return false;
    }
    const repeatInterval = form.controls['repeatTime'].value !== ('None' || undefined) ? Utils.convertTimeToSec(
      form.controls['repeatTime'].value, form.controls['repeatDays'].value) : 0;
    const updatePayload = {
      'repeat': repeatInterval,
      'exclusive': form.controls['exclusive'].value,
      'enabled': form.controls['enabled'].value
    };
    /** request started */
    this.ngProgress.start();
    this.schedulesService.updateSchedule(this.task['id'], updatePayload).
      subscribe(
        () => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success('Schedule updated successfully.');
          this.notify.emit();
          this.toggleModal(false);
          form.reset();
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

  proxy() {
    document.getElementById('vci-proxy').click();
    if (this.viewConfigItemComponent !== undefined && !this.viewConfigItemComponent.isValidForm) {
      return false;
    }
    document.getElementById('ss').click();
  }

  getTimeIntervalValue(event) {
    this.repeatTime = event.target.value;
  }
}
