import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { NgForm } from '@angular/forms';
import { differenceWith, find, sortBy } from 'lodash';
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
  @Output() onConfigChanged: EventEmitter<any> = new EventEmitter<any>();

  public categoryConfiguration;
  public configItems = [];
  public isValidForm: boolean;
  public isWizardCall = false;

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
            key: el.key,
            value: el.value !== undefined ? el.value : el.default,
            type: el.type
          });
        });
      }
    }
  }

  public difference(obj, bs) {
    const changedValues = differenceWith(obj, bs, (oldData: any, newData: any) => {
      return oldData.key === newData.key && oldData.value.toString() === newData.value.toString();
    });

    changedValues.forEach(element => {
      const f = find(bs, { key: element.key });
      if (f !== undefined) {
        element.type = f['type'];
      }
    });
    console.log('changed values', changedValues);
    return changedValues;
  }


  public saveConfiguration(form: NgForm) {
    this.isValidForm = true;
    if (!form.valid) {
      this.isValidForm = false;
      return false;
    }
    const formData = [];
    for (const key in form.value) {
      const d = {
        key: key,
        value: form.value[key]
      };
      formData.push(d);
    }
    const diff = this.difference(formData, this.configItems);

    // condition to check if called from add service wizard
    if (this.isWizardCall) {
      this.onConfigChanged.emit(diff);
      return;
    }
    diff.forEach(changedItem => {
      this.saveConfigValue(this.categoryConfiguration.key, changedItem.key, changedItem.value, changedItem.type);
    });
  }

  public saveConfigValue(categoryName: string, configItem: string, value: string, type: string) {
    /** request started */
    this.ngProgress.start();
    this.configService.saveConfigItem(categoryName, configItem, value.toString(), type).
      subscribe(
        (data: any) => {
          // fill configItems with changed data
          this.configItems.map(item => item.key === configItem ? item.value = data.value.toString() : item.value);
          /** request completed */
          this.ngProgress.done();
          this.alertService.success('Configuration updated successfully.');
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

  /**
   * Method to set ngModal value
   * @param configVal Config value to pass in ngModel
   */
  public setConfigValue(configVal) {
    if (configVal.value !== undefined && configVal.value !== '') {
      return configVal.value;
    } else {
      return configVal.default;
    }
  }

  /**
   * Method to set isWizardCall = true if called from
   * add south or north wizard.
   */
  public callFromWizard() {
    this.isWizardCall = true;
  }

  /**
   * Check if object has a specific key
   * @param o Object
   * @param name key name
   */
  public hasProperty(o, name) {
    return o.hasOwnProperty(name);
  }

  /**
   * display config item name on gui
   * @param configItem config item object
   */
  public setDisplayName(configItem) {
    if (this.hasProperty(configItem, 'displayName')) {
      return configItem.displayName.trim().length > 0 ? configItem.displayName : configItem.key;
    }
    return configItem.key;
  }
}
