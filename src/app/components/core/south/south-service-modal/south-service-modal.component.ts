import { ConfigurationService, AlertService } from '../../../../services';
import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';

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

  constructor(private configService: ConfigurationService, private alertService: AlertService) { }

  ngOnInit() { }

  ngOnChanges() {
    if (this.service !== undefined) {
      this.getCategory();
    }
  }
  public toggleModal(isOpen: Boolean) {
    this.isSaved = false;
    const schedule_name = <HTMLDivElement>document.getElementById('south-service-modal');
    if (isOpen) {
      schedule_name.classList.add('is-active');
      return;
    }
    schedule_name.classList.remove('is-active');
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

}
