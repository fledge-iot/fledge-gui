import { ConfigurationService, AlertService, SchedulesService } from '../../../../services';
import { Component, OnInit, Input, Output, OnChanges, EventEmitter } from '@angular/core';
import { NgForm, FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as _ from 'lodash';
import Utils from '../../../../utils';

@Component({
  selector: 'app-north-task-modal',
  templateUrl: './north-task-modal.component.html',
  styleUrls: ['./north-task-modal.component.css']
})
export class NorthTaskModalComponent implements OnInit, OnChanges {
  category: any;

  configItems = [];

  model: any;

  enabled: Boolean;
  exclusive: Boolean;
  repeat: any;
  processName: any;
  form: FormGroup;

  isSaved = false;

  @Input()
  task: { task: any };

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private schedulesService: SchedulesService,
    private configService: ConfigurationService,
    private alertService: AlertService,
    public fb: FormBuilder
  ) {}

  ngOnInit() {}

  ngOnChanges() {
    if (this.task !== undefined) {
      this.getCategory();
    }
    const regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$'; // Regex to varify time format 00:00:00
    this.form = this.fb.group({
      repeat: ['', [Validators.required, Validators.pattern(regExp)]],
      exclusive: [Validators.required],
      enabled: [Validators.required]
    });
  }

  public toggleModal(isOpen: Boolean) {
    this.isSaved = false;
    const modal = <HTMLDivElement>document.getElementById('north-task-modal');
    if (isOpen) {
      modal.classList.add('is-active');
      return;
    }
    modal.classList.remove('is-active');
  }

  public getCategory(): void {
    this.enabled = this.task['enabled'];
    this.exclusive = this.task['exclusive'];
    this.repeat = Utils.secondsToDhms(this.task['repeat']).time;
    this.processName = this.task['processName'];

    this.configService.getCategory(this.processName).subscribe(
      (data: any) => {
        this.category = {
          value: [data],
          key: this.processName
        };

        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            this.configItems.push({
              [key]: data[key].value,
              type: data[key].type
            });
          }
        }
      },
      error => {
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText, true);
        }
      }
    );
  }

  public saveConfiguration(form: NgForm) {
    const updatedRecord = [];
    const formData = form.value;
    for (const key in formData) {
      if (formData.hasOwnProperty(key)) {
        updatedRecord.push({
          [key]: formData[key]
        });
      }
    }

    const diff = this.difference(updatedRecord, this.configItems);
    this.configItems.forEach(item => {
      for (const key in item) {
        diff.forEach(changedItem => {
          for (const k in changedItem) {
            if (key === k && item[key] !== changedItem[k]) {
              this.saveConfigValue(
                this.task['processName'],
                key,
                changedItem[k],
                item.type
              );
              item[key] = changedItem[k];
            }
          }
        });
      }
    });
  }

  public difference(obj, bs) {
    function changes(object, base) {
      return _.transform(object, function(result, value, key) {
        if (!_.isEqual(value, base[key])) {
          result[key] =
            _.isObject(value) && _.isObject(base[key])
              ? changes(value, base[key])
              : value;
        }
      });
    }
    return changes(obj, bs);
  }

  public hideNotification() {
    this.isSaved = false;
    const deleteBtn = <HTMLDivElement>document.getElementById('delete');
    deleteBtn.parentElement.classList.add('is-hidden');
    return false;
  }

  public saveConfigValue(
    categoryName: string,
    configItem: string,
    value: string,
    type: string
  ) {
    this.configService
      .saveConfigItem(categoryName, configItem, value, type)
      .subscribe(
        data => {
          if (data['value'] !== undefined) {
            this.isSaved = true;
          }
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        }
      );
  }

  public saveScheduleFields(form: NgForm) {
    const repeatTime = Utils.convertTimeToSec(form.controls['repeat'].value);

    const updatePayload = {
      'repeat': repeatTime,
      'exclusive': form.controls['exclusive'].value,
      'enabled': form.controls['enabled'].value
    };

    this.schedulesService.updateSchedule(this.task['id'], updatePayload).
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
