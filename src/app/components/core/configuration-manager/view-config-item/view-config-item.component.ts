import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { NgForm } from '@angular/forms';
import { isEmpty, isEqual, isObject, reject, sortBy, transform } from 'lodash';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, ConfigurationService } from '../../../../services';
import ConfigTypeValidation from '../configuration-type-validation';

@Component({
  selector: 'app-view-config-item',
  templateUrl: './view-config-item.component.html',
  styleUrls: ['./view-config-item.component.css']
})
export class ViewConfigItemComponent implements OnInit, OnChanges {
  @Input() categoryConfigurationData: any;
  @Input() useProxy: 'false';

  public categoryConfiguration;
  public selectedValue: string;
  public isValidJson = true;
  public selectedCategoryId: string;
  public isEmptyValue = false;
  public configItems = [];

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    public ngProgress: NgProgress) { }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {
    this.configItems = [];
    if (changes.categoryConfigurationData.currentValue !== undefined) {
      let configAttributes = [];
      if (changes.categoryConfigurationData.currentValue.length !== 0) {
        const currentConfigValue = changes.categoryConfigurationData.currentValue.value;
        for (const key in currentConfigValue[0]) {
          if (currentConfigValue[0].hasOwnProperty(key)) {
            const element = currentConfigValue[0][key];
            element.key = key;
            configAttributes.push(element);
          }
        }
        configAttributes = sortBy(configAttributes, function (ca) {
          return parseInt(ca.order, 10);
        });
        changes.categoryConfigurationData.currentValue.value = configAttributes;
        this.categoryConfiguration = changes.categoryConfigurationData.currentValue;
        configAttributes.forEach(el => {
          this.configItems.push({
            [el.key]: el.value,
            type: el.type
          });
        });
      }
    }
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

    console.log('config items', this.configItems);
    // TODO: This code need to be optimized further
    const copyConfigItems = [];
    for (const k in updatedRecord) {
      for (const kk in updatedRecord[k]) {
        copyConfigItems.push({ [kk]: this.getConfigItemToSave(kk)[kk] });
      }
    }
    console.log('copy of config items', copyConfigItems);

    let diff = [] = this.difference(updatedRecord, copyConfigItems);
    diff = reject(diff, isEmpty);
    console.log('config diff', diff);
    diff.forEach(changedItem => {
      let item = null;
      let changedItemKey = null;
      for (const x in changedItem) {
        item = this.getConfigItemToSave(x);
        changedItemKey = x;
      }
      this.saveConfigValue(this.categoryConfiguration.key, changedItemKey, changedItem[changedItemKey], item.type);
    });
  }

  getConfigItemToSave(catKey) {
    for (const ci in this.configItems) {
      for (const key in this.configItems[ci]) {
        if (key === catKey) {
          return this.configItems[ci];
        }
      }
    }
  }

  public saveConfigValue(categoryName: string, configItem: string, value: string, type: string) {
    if (type.toUpperCase() === 'JSON') {
      this.isValidJson = ConfigTypeValidation.isValidJsonString(value);
      if (!this.isValidJson) {
        return;
      }
    }

    /** request started */
    this.ngProgress.start();
    this.configService.saveConfigItem(categoryName, configItem, value.toString(), type).
      subscribe(
        () => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success('Value updated successfully');
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

  public getConfigAttributeType(key) {
    return ConfigTypeValidation.getValueType(key);
  }
}
