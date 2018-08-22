import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { NgForm } from '@angular/forms';
import { isEqual, isObject, sortBy, transform } from 'lodash';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, ConfigurationService, SchedulesService } from '../../../../services';
import ConfigTypeValidation from '../../configuration-manager/configuration-type-validation';

@Component({
  selector: 'app-south-service-modal',
  templateUrl: './south-service-modal.component.html',
  styleUrls: ['./south-service-modal.component.css']
})
export class SouthServiceModalComponent implements OnInit, OnChanges {

  public category: any;
  public configItems = [];
  public model: any;
  public isSaved = false;
  public isEnabled;

  @Input() service: { service: any };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    public ngProgress: NgProgress,
    private schedulesService: SchedulesService) { }

  ngOnInit() { }

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
        (data) => {
          let configAttributes = [];
          for (const key in data) {
            if (data.hasOwnProperty(key)) {
              const element = data[key];
              element.key = key;
              configAttributes.push(element);
            }
          }
          configAttributes = sortBy(configAttributes, ['order', 'description']);
          this.category = {
            value: configAttributes,
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

  public getConfigAttributeType(key) {
    return ConfigTypeValidation.getValueType(key);
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
      return transform(object, function (result, value, key) {
        if (!isEqual(value, base[key])) {
          result[key] = (isObject(value) && isObject(base[key])) ? changes(value, base[key]) : value;
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
