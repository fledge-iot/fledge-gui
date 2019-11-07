import { AfterViewInit, Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { differenceWith, isEqual, isEmpty } from 'lodash';

import { ConfigurationService } from '../../../../services';
import { ValidateFormService } from '../../../../services/validate-form.service';
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
  @ViewChild('f', { static: true }) form;

  constructor(private configService: ConfigurationService,
    private validateFormService: ValidateFormService) { }

  ngAfterViewInit() {
    this.form.control.valueChanges
      .subscribe(values => {
        const formData = [];
        for (const key in values) {
          const d = {
            key: key,
            value: values[key] === null ? '0' : values[key].toString(),
            type: this.configItems.find(conf => {
              return conf.key === key;
            }).type
          };
          if (this.form.valid) {
            formData.push(d);
          }
        }
        const changedConfigValues = differenceWith(formData, this.configItems, isEqual);
        if (!isEmpty(changedConfigValues)) {
          this.onConfigChanged.emit(changedConfigValues);
        }
        if (!(this.validateFormService.checkConfigChildrenForm(this.form.valid))) {
          return;
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
    if (configVal.value !== undefined) {
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
    this.configService.getCategory(categoryConfig.key).
      subscribe(
        (data: any) => {
          this.configItems = [];
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

  checkValueOnChange(key: string, configValue: string) {
    this.configAttributes.map(configItem => {
      if (configItem.hasOwnProperty('mandatory') && configItem['key'] === key) {
       if (configItem['mandatory'] === 'true' && configValue.trim().length === 0) {
        this.form.controls[key].setErrors({'required': true});
       }
      }
    });
  }
}
