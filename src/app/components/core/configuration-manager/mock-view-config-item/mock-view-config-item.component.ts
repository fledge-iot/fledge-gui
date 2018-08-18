import { Component, Input, OnInit } from '@angular/core';

import { NgProgress } from 'ngx-progressbar';
import { AlertService, ConfigurationService } from '../../../../services';
import ConfigTypeValidation from '../configuration-type-validation';

@Component({
  selector: 'app-mock-view-config-item',
  templateUrl: './mock-view-config-item.component.html',
  styleUrls: ['./mock-view-config-item.component.css']
})
export class MockViewConfigItemComponent implements OnInit {
  @Input() categoryConfigurationData: any;
  public selectedValue: string;
  public isValidJson = true;
  public selectedCategoryId: string;
  public isEmptyValue = false;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    public ngProgress: NgProgress) { }

  ngOnInit() { }

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
    console.log('value', value);
    if (value.trim().length !== 0) {
      this.isEmptyValue = false;
      return;
    }
  }
}
