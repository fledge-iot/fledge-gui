import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { NgForm } from '@angular/forms';
import { differenceWith, sortBy, isEqual, isEmpty, cloneDeep, has } from 'lodash';

import { AlertService, ConfigurationService, ProgressBarService } from '../../../../services';
import ConfigTypeValidation from '../configuration-type-validation';

@Component({
  selector: 'app-view-config-item',
  templateUrl: './view-config-item.component.html',
  styleUrls: ['./view-config-item.component.css']
})
export class ViewConfigItemComponent implements OnInit, OnChanges {
  @Input() categoryConfigurationData: any;
  @Input() useProxy = 'false';
  @Input() useFilterProxy = 'false';
  @Input() useRuleProxy = 'false';
  @Input() useDeliveryProxy = 'false';
  @Input() formId = '';
  @Input() pageId = 'page';
  @Output() onConfigChanged: EventEmitter<any> = new EventEmitter<any>();

  public categoryConfiguration;
  public configItems = [];
  public isValidForm: boolean;
  public isWizardCall = false;
  public filesToUpload = [];
  public hasEditableConfigItems = true;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService
  ) { }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {
    this.filesToUpload = [];
    this.configItems = [];
    const categoryConfigurationCurrentData = cloneDeep(changes.categoryConfigurationData.currentValue);
    if (categoryConfigurationCurrentData !== undefined) {
      let configAttributes = [];
      if (categoryConfigurationCurrentData.length !== 0) {
        const currentConfigValues = categoryConfigurationCurrentData.value[0];
        configAttributes = Object.keys(currentConfigValues).map(key => {
          const element = currentConfigValues[key];
          element.key = key;
          return element;
        });

        configAttributes = sortBy(configAttributes, function (ca) {
          return parseInt(ca.order, 10);
        });

        categoryConfigurationCurrentData.value = configAttributes;
        this.categoryConfiguration = categoryConfigurationCurrentData;
        this.configItems = configAttributes.map(el => {
          return {
            key: el.key,
            value: el.value !== undefined ? el.value : el.default,
            type: el.type
          };
        });
        // check if editable config item found, based on readonly property
        for (const el of this.categoryConfiguration.value) {
          if (!has(el, 'readonly') || el.readonly === 'false') {
            this.hasEditableConfigItems = true;
            break;
          } else {
            this.hasEditableConfigItems = false;
          }
        }
      }
    }
  }

  public saveConfiguration(form: NgForm) {

    this.isValidForm = true;
    if (!form.valid) {
      this.isValidForm = false;
      return;
    }

    const formData = Object.keys(form.value).map(key => {
      return {
        key: key,
        value: form.value[key] === null ? '0' : form.value[key].toString()
      };
    });

    formData.map(d => {
      return this.configItems.map(conf => {
        if (conf.key === d.key) {
          d['type'] = conf.type;  // there is no key 'type' in the object
          d.value = d.value.toString();
        }
        return d;
      });
    });

    const changedConfigValues = differenceWith(formData, this.configItems, isEqual);
    let isConfigChanged = false;
    // condition to check if called from wizard
    if (this.isWizardCall) {
      if (this.filesToUpload.length > 0) {
        changedConfigValues.push({ key: 'script', 'value': this.filesToUpload, 'type': 'script' });
      }
      this.onConfigChanged.emit(changedConfigValues);
      return;
    }
    this.updateConfiguration(this.categoryConfiguration.key, changedConfigValues);
    if (changedConfigValues.length > 0) {
      isConfigChanged = true;
    }
    if (this.filesToUpload.length > 0) {
      this.uploadScript(isConfigChanged);
    }
  }

  public fileChange(event, configItem) {
    const fi = event.target;
    if (fi.files && fi.files[0]) {
      const file = fi.files[0];
      this.filesToUpload.push({ [configItem]: file });
    }
  }

  updateConfiguration(categoryName, changedConfig) {
    changedConfig = changedConfig.map(el => {
      if (el.type.toUpperCase() === 'JSON') {
        el.value = JSON.parse(el.value);
      }
      return {
        [el.key]: el.value !== undefined ? el.value : el.default,
      };
    });

    changedConfig = Object.assign({}, ...changedConfig); // merge all object into one
    if (isEmpty(changedConfig)) {
      return;
    }

    /** request started */
    this.ngProgress.start();
    this.configService.updateBulkConfiguration(categoryName, changedConfig).
      subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success('Configuration updated successfully.');

          // fill configItems with changed data
          this.configItems = Object.keys(data).map(key => {
            return {
              key: key,
              value: data[key].value,
              type: data[key].type
            };
          });
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

  public getConfigItem(configItem) {
    this.configService.getConfigItem(this.categoryConfiguration.key, configItem)
      .subscribe(data => {
        this.categoryConfiguration.value.forEach(item => {
          if (item.key === configItem) {
            item.value = data['value'];
            item.description = data['description'];
            item.key = configItem;
          }
        });
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
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
   * Method to set isWizardCall = true if called from
   * add south or north wizard.
   */
  public callFromWizard() {
    this.isWizardCall = true;
  }

  public uploadScript(isConfigChanged) {
    this.filesToUpload.forEach(data => {
      let configItem: any;
      configItem = Object.keys(data)[0];
      const file = data[configItem];
      const formData = new FormData();
      formData.append('script', file);
      if (!isConfigChanged) {
        this.ngProgress.start();
      }
      this.configService.uploadFile(this.categoryConfiguration.key, configItem, formData)
        .subscribe(() => {
          this.filesToUpload = [];
          if (!isConfigChanged) {
            this.ngProgress.done();
            this.alertService.success('Configuration updated successfully.');
          }
          this.getConfigItem(configItem);
        },
          error => {
            this.filesToUpload = [];
            if (!isConfigChanged) {
              this.ngProgress.done();
            }
            if (error.status === 0) {
              console.log('service down ', error);
            } else {
              this.alertService.error(error.statusText);
            }
          });
    });
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

  public toggleDropdown(key) {
    const dropDown = document.querySelector('#' + key + '-dropdown');
    dropDown.classList.toggle('is-active');
  }

  public checkButtonProxy() {
    if (this.useProxy === 'false'
      && this.useFilterProxy === 'false'
      && this.useRuleProxy === 'false'
      && this.useDeliveryProxy === 'false') {
      return 'false';
    }
  }
}
