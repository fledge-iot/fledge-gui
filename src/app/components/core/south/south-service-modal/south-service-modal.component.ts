import { Component, Input, OnChanges, OnInit, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';

import { AlertService, ConfigurationService, SchedulesService } from '../../../../services';
import { NgProgress } from 'ngx-progressbar';

@Component({
  selector: 'app-south-service-modal',
  templateUrl: './south-service-modal.component.html',
  styleUrls: ['./south-service-modal.component.css']
})
export class SouthServiceModalComponent implements OnInit, OnChanges {

  category: any;

  configItems = [];

  model: any;

  @Input() service: { service: any };

  isSaved = false;

  public isEnabled;

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    public ngProgress: NgProgress,
    private schedulesService: SchedulesService) { }

  ngOnInit() {
  }

  ngOnChanges() {
    if (this.service !== undefined) {
      this.getCategory();
    }
  }
  public toggleModal(isOpen: Boolean) {
    this.isSaved = false;
    const modalWindow = <HTMLDivElement>document.getElementById('south-service-modal');
    if (isOpen) {
      modalWindow.classList.add('is-active');
      return;
    }
    modalWindow.classList.remove('is-active');
  }

  public getCategory(): void {
    this.configService.getCategory(this.service['name']).
      subscribe(
        (data: any) => {
          this.category = {
            value: [data],
            key: this.service['name']
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
        });
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
              item[key] = changedItem[k],
                this.saveConfigValue(this.service['name'], key, changedItem[k], item.type);
            }
          }
        });
      }
    });
  }

  public difference(obj, bs) {
    function changes(object, base) {
      return _.transform(object, function (result, value, key) {
        if (!_.isEqual(value, base[key])) {
          result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
        }
      });
    }
    return changes(obj, bs);
  }

  public saveConfigValue(categoryName: string, configItem: string, value: string, type: string) {
    this.configService.saveConfigItem(categoryName, configItem, value, type).
      subscribe(
        (data) => {
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
        });
  }

  public showNotification() {
    const notificationMsg = <HTMLDivElement>document.getElementById('message');
    notificationMsg.classList.remove('is-hidden');
    return false;
  }

  public hideNotification() {
    this.isSaved = false;
    const deleteBtn = <HTMLDivElement>document.getElementById('delete');
    deleteBtn.parentElement.classList.add('is-hidden');
    return false;
  }

  public disableSchedule(serviceName) {
    console.log('Disabling Schedule:', serviceName);
    /** request started */
    this.ngProgress.start();
    this.schedulesService.disableScheduleByName(serviceName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.notify.emit();
          this.alertService.success(data['message'], true);
          this.toggleModal(false);
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

  public enableSchedule(serviceName) {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.enableScheduleByName(serviceName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.notify.emit();
          this.toggleModal(false);
          this.alertService.success(data['message'], true);
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

  onCheckboxClicked(event) {
    if (event.target.checked) {
      this.isEnabled = true;
    } else {
      this.isEnabled = false;
    }
  }

  changeServiceStatus(serviceName) {
    if (this.isEnabled) {
      this.enableSchedule(serviceName);
    } else {
      this.disableSchedule(serviceName);
    }
  }
}
