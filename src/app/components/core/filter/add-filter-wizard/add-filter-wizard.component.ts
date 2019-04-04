import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { assign, reduce, sortBy } from 'lodash';

import { AlertService, ConfigurationService, FilterService } from '../../../../services';
import { ViewConfigItemComponent } from '../../configuration-manager/view-config-item/view-config-item.component';

@Component({
  selector: 'app-add-filter-wizard',
  templateUrl: './add-filter-wizard.component.html',
  styleUrls: ['./add-filter-wizard.component.css']
})
export class AddFilterWizardComponent implements OnInit {

  public plugins = [];
  public categories = [];
  public configurationData;
  public useProxy;
  public isValidPlugin = true;
  public isSinglePlugin = true;
  public isValidName = true;
  public payload: any;
  public selectedPluginDescription = '';

  public filesToUpload = [];

  serviceForm = new FormGroup({
    name: new FormControl(),
    plugin: new FormControl()
  });

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @Input() serviceName: any;

  @ViewChild(ViewConfigItemComponent) viewConfigItem: ViewConfigItemComponent;

  constructor(private formBuilder: FormBuilder,
    private filterService: FilterService,
    private configurationService: ConfigurationService,
    private configService: ConfigurationService,
    private alertService: AlertService) { }

  ngOnInit() {
    this.getCategories();
    this.serviceForm = this.formBuilder.group({
      name: ['', Validators.required],
      plugin: ['', Validators.required]
    });
    this.getInstalledFilterPlugins();
  }

  movePrevious() {
    const last = <HTMLElement>document.getElementsByClassName('step-item is-active')[0];
    const id = last.getAttribute('id');
    if (+id === 1) {
      this.notify.emit();
      return;
    }
    last.classList.remove('is-active');
    const sId = +id - 1;
    const previous = <HTMLElement>document.getElementById('' + sId);
    previous.setAttribute('class', 'step-item is-active');

    const stepContent = <HTMLElement>document.getElementById('c-' + id);
    if (stepContent != null) {
      stepContent.classList.remove('is-active');
    }

    const nextContent = <HTMLElement>document.getElementById('c-' + sId);
    if (nextContent != null) {
      nextContent.setAttribute('class', 'box step-content is-active');
    }

    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    switch (+id) {
      case 2:
        nxtButton.textContent = 'Next';
        nxtButton.disabled = false;
        break;
      default:
        break;
    }
  }

  moveNext() {
    this.isValidPlugin = true;
    this.isValidName = true;
    const formValues = this.serviceForm.value;
    const first = <HTMLElement>document.getElementsByClassName('step-item is-active')[0];
    const id = first.getAttribute('id');
    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const previousButton = <HTMLButtonElement>document.getElementById('previous');
    switch (+id) {
      case 1:
        if (formValues['plugin'] === '') {
          this.isValidPlugin = false;
          return;
        }

        if (formValues['plugin'].length !== 1) {
          this.isSinglePlugin = false;
          return;
        }

        if (formValues['name'].trim() === '') {
          this.isValidName = false;
          return;
        }
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Previous';

        // To verify if category (or filter itself) with this name already exists
        // hence filter can not be created with that name
        const isFilterExist = this.categories.some(item => {
          return formValues['name'].trim() === item.key;
        });
        if (isFilterExist) {
          this.alertService.error('A filter (or category) with this name already exists.');
          return;
        }

        // create payload
        if (formValues['name'].trim() !== '' && formValues['plugin'].length > 0) {
          this.payload = {
            name: formValues['name'],
            plugin: formValues['plugin'][0]
          };
        }

        this.getConfiguration(formValues['name'].trim());
        nxtButton.textContent = 'Done';
        previousButton.textContent = 'Previous';
        break;
      case 2:
        this.viewConfigItem.callFromWizard();
        document.getElementById('vci-proxy').click();
        if (this.viewConfigItem !== undefined && !this.viewConfigItem.isValidForm) {
          return false;
        }
        this.addFilter(this.payload);
        break;
      default:
        break;
    }

    if (+id >= 2) {
      return false;
    }

    first.classList.remove('is-active');
    first.classList.add('is-completed');
    const sId = +id + 1;
    const next = <HTMLElement>document.getElementById('' + sId);
    if (next != null) {
      next.setAttribute('class', 'step-item is-active');
    }

    const stepContent = <HTMLElement>document.getElementById('c-' + id);
    if (stepContent != null) {
      stepContent.classList.remove('is-active');
    }

    const nextContent = <HTMLElement>document.getElementById('c-' + sId);
    if (nextContent != null) {
      nextContent.setAttribute('class', 'box step-content is-active');
    }
  }

  getDescription(selectedPlugin) {
    if (selectedPlugin === '') {
      this.isValidPlugin = false;
      this.selectedPluginDescription = '';
      this.serviceForm.value['plugin'] = '';
    } else {
      this.isSinglePlugin = true;
      this.isValidPlugin = true;
      const plugin = (selectedPlugin.slice(3).trim()).replace(/'/g, '');
      this.selectedPluginDescription = this.plugins.find(p => p.name === plugin).description;
    }
  }

  /**
   *  Get default configuration of a selected plugin
   */
  private getConfiguration(filterName: string): void {
    const config = this.plugins.map(p => {
      if (p.name === this.payload.plugin) {
        return p.config;
      }
    }).filter(value => value !== undefined);

    // array to hold data to display on configuration page
    this.configurationData = { key: this.serviceName + '_' + filterName, 'value': config };
    this.useProxy = 'true';
  }

  /**
   * Get edited configuration from view filter config child page
   * @param changedConfig changed configuration of a selected plugin
   */
  getChangedConfig(changedConfig) {
    // final array to hold changed configuration
    let finalConfig = [];
    changedConfig.forEach(item => {
      if (item.type === 'script') {
        this.filesToUpload = item.value;
      } else {
        finalConfig.push({
          [item.key]: item.type === 'JSON' ? JSON.parse(item.value) : item.value
        });
      }
    });

    // convert finalConfig array in object of objects to pass in add service
    finalConfig = reduce(finalConfig, function (memo, current) { return assign(memo, current); }, {});
    this.payload.filter_config = finalConfig;
  }

  /**
   * Method to add filter
   * @param payload  to pass in request
   */
  public addFilter(payload) {
    this.filterService.saveFilter(payload)
      .subscribe(
        (data: any) => {
          this.alertService.success(data.filter + ' filter added successfully.', true);
          this.addFilterPipeline({ 'pipeline': [payload.name] });
        },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public uploadScript() {
    this.filesToUpload.forEach(data => {
      let configItem: any;
      configItem = Object.keys(data)[0];
      const file = data[configItem];
      const formData = new FormData();
      formData.append('script', file);
      this.configService.uploadFile(this.configurationData.key, configItem, formData)
        .subscribe(() => {
          this.filesToUpload = [];
          this.alertService.success('configuration updated successfully.');
        },
          error => {
            this.filesToUpload = [];
            if (error.status === 0) {
              console.log('service down ', error);
            } else {
              this.alertService.error(error.statusText);
            }
          });
    });
  }


  public addFilterPipeline(payload) {
    this.filterService.addFilterPipeline(payload, this.serviceName)
      .subscribe((data: any) => {
        this.notify.emit(data);
        if (this.filesToUpload !== []) {
          this.uploadScript();
        }
      },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  validateServiceName(event) {
    if (event.target.value.trim().length > 0) {
      this.isValidName = true;
    }
  }

  public getInstalledFilterPlugins() {
    this.filterService.getInstalledFilterPlugins().subscribe(
      (data: any) => {
        this.plugins = sortBy(data.plugins, p => {
          return p.name.toLowerCase();
        });
      },
      (error) => {
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  public getCategories(): void {
    this.configurationService.getCategories().
      subscribe(
        (data: any) => {
          this.categories = data.categories;
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText, true);
          }
        }
      );
  }
}
