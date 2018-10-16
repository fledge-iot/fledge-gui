import { AfterViewInit, Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { differenceWith, find } from 'lodash';

import { ConfigurationService } from '../../../../services';
import ConfigTypeValidation from '../configuration-type-validation';

@Component({
  selector: 'app-config-children',
  templateUrl: './config-children.component.html',
  styleUrls: ['./config-children.component.css']
})
export class ConfigChildrenComponent implements AfterViewInit {

  configuration = [];
  configItems = [];
  configAttributes = [];

  @Output() onConfigChanged: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('f') form;

  constructor(private configService: ConfigurationService) { }

  ngAfterViewInit() {
    this.form.control.valueChanges
      .subscribe(values => {
        const formData = [];
        for (const key in values) {
          const d = {
            key: key,
            value: values[key]
          };
          formData.push(d);
        }
        const diff = this.difference(formData, this.configItems);
        this.onConfigChanged.emit(diff);
      });
  }

  public difference(obj, bs) {
    const changedValues = differenceWith(obj, bs, (oldData: any, newData: any) => {
      return oldData.key === newData.key && (oldData.value !== null && newData.value !== null)
        && (oldData.value.toString() === newData.value.toString());
    });

    changedValues.forEach(element => {
      const f = find(bs, { key: element.key });
      if (f !== undefined) {
        element.type = f['type'];
      }
    });
    return changedValues;
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

  getAdvanceConfig(categoryConfig, isAdvanceConfig = false) {
    if (categoryConfig === null || !isAdvanceConfig) {
      this.configuration = undefined;
      return;
    }
    this.configAttributes = [];
    this.configItems = [];
    this.configService.getCategory(categoryConfig.key).
      subscribe(
        (data: any) => {
          this.configuration = data;
          for (const key in this.configuration) {
            if (this.configuration.hasOwnProperty(key)) {
              const element = this.configuration[key];
              element.key = key;
              this.configAttributes.push(element);
            }
          }
          this.configAttributes.forEach(el => {
            this.configItems.push({
              key: el.key,
              value: el.value !== undefined ? el.value : el.default,
              type: el.type
            });
          });
        },
        error => {
          console.log('error ', error);
        }
      );
  }
}
