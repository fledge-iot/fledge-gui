import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { sortBy } from 'lodash';
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
  public categoryConfiguration;
  public selectedValue: string;
  public isValidJson = true;
  public selectedCategoryId: string;
  public isEmptyValue = false;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    public ngProgress: NgProgress) { }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {
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
        configAttributes = sortBy(configAttributes, ['order', 'description']);
        changes.categoryConfigurationData.currentValue.value = configAttributes;
        this.categoryConfiguration = changes.categoryConfigurationData.currentValue;
      }
    }
  }

  public restoreConfigFieldValue(configItemKey, categoryKey, configValue, configType) {
    let itemKey = categoryKey.toLowerCase() + '-' + configItemKey.toLowerCase();
    if (itemKey.includes('select')) {
      itemKey = itemKey.replace('select-', '');
    }
    this.isEmptyValue = false;
    let htmlElement: any;
    htmlElement = <HTMLInputElement>document.getElementById(itemKey);
    if (htmlElement == null) {
      htmlElement = <HTMLSelectElement>document.getElementById('select-' + itemKey);
      htmlElement.selectedIndex = (this.selectedValue === 'true' ? 1 : 0);
    } else {
      htmlElement.value = htmlElement.textContent;
    }

    const cancelButton = <HTMLButtonElement>document.getElementById('btn-cancel-' + itemKey);
    cancelButton.classList.add('hidden');

    if (configType.toUpperCase() === 'JSON') {
      this.isValidJson = ConfigTypeValidation.isValidJsonString(configValue);
      return;
    }
  }

  public saveConfigValue(categoryName, configItem, type) {
    const catItemId = categoryName.toLowerCase() + '-' + configItem.toLowerCase();
    this.selectedCategoryId = catItemId;
    let htmlElement: any;
    htmlElement = <HTMLInputElement>document.getElementById(catItemId);

    let value;
    if (htmlElement == null) {
      htmlElement = <HTMLSelectElement>document.getElementById('select-' + catItemId);
      value = htmlElement.options[htmlElement.selectedIndex].value;
      this.isEmptyValue = false;
    } else {
      value = htmlElement.value.trim();
      if (value.length === 0) {
        this.isEmptyValue = true;
        return;
      }
    }

    if (type.toUpperCase() === 'JSON') {
      this.isValidJson = ConfigTypeValidation.isValidJsonString(value);
      if (!this.isValidJson) {
        return;
      }
    }

    const cancelButton = <HTMLButtonElement>document.getElementById('btn-cancel-' + catItemId);
    cancelButton.classList.add('hidden');

    /** request started */
    this.ngProgress.start();
    this.configService.saveConfigItem(categoryName, configItem, value, type).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          if (data['value'] !== undefined) {
            if (htmlElement.type === 'select-one') {
              htmlElement.selectedIndex = (data['value'] === 'true' ? 0 : 1);
            } else {
              htmlElement.textContent = htmlElement.value = data['value'];
            }
            this.alertService.success('Value updated successfully');
          }
        },
        error => {
          // reset to default value
          this.restoreConfigFieldValue(configItem, categoryName, value, type);
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

  public onTextChange(configItemKey, value) {
    if (configItemKey.includes('select')) {
      configItemKey = configItemKey.replace('select-', '');
      this.selectedValue = value;
    }
    const cancelButton = <HTMLButtonElement>document.getElementById('btn-cancel-' + configItemKey.toLowerCase());
    cancelButton.classList.remove('hidden');
    if (value.trim().length !== 0) {
      this.isEmptyValue = false;
      return;
    }
  }
}
