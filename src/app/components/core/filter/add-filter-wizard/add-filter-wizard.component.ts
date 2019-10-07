import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { assign, reduce, sortBy, isEmpty } from 'lodash';

import { AlertService, ConfigurationService, FilterService, ServicesApiService, ProgressBarService } from '../../../../services';
import { ViewConfigItemComponent } from '../../configuration-manager/view-config-item/view-config-item.component';
import { ValidateFormService } from '../../../../services/validate-form.service';

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
  public pluginData = [];
  public filesToUpload = [];

  public requestInProgress = false;

  public show = false;

  config = {
    search: true,
    height: '200px',
    placeholder: 'Choose from available filter plugins',
    limitTo: this.pluginData.length,
    moreText: 'more', // text to be displayed when more than one items are selected like Option 1 + 5 more
    noResultsFound: 'No plugin found!',
    searchPlaceholder: 'Search',
  };

  serviceForm = new FormGroup({
    name: new FormControl(),
    plugin: new FormControl(),
    pluginToInstall: new FormControl()
  });

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @Input() serviceName: any;

  @ViewChild(ViewConfigItemComponent, { static: true }) viewConfigItem: ViewConfigItemComponent;

  constructor(private formBuilder: FormBuilder,
    private filterService: FilterService,
    private configurationService: ConfigurationService,
    private configService: ConfigurationService,
    private alertService: AlertService,
    private service: ServicesApiService,
    private validateFormService: ValidateFormService,
    private ngProgress: ProgressBarService) { }

  ngOnInit() {
    this.getCategories();
    this.serviceForm = this.formBuilder.group({
      name: ['', Validators.required],
      plugin: ['', Validators.required],
      pluginToInstall: ['', Validators.required]
    });
    this.getInstalledFilterPlugins();
  }

  toggleAvailablePlugins() {
    if (this.show) {
      this.show = false;
      return;
    }
    this.show = true;
    this.getAvailablePlugins('Filter');
  }

  fetchPluginRequestStarted() {
    this.ngProgress.start();
    const requestInProgressEle: HTMLElement = document.getElementById('requestInProgress') as HTMLElement;
    requestInProgressEle.innerHTML = 'fetching available plugins ...';
  }

  fetchPluginRequestDone() {
    this.ngProgress.done();

    if (this.pluginData.length) {
      const ddnEle: HTMLElement = document.getElementsByClassName('ngx-dropdown-button')[0] as HTMLElement;
      if (ddnEle !== undefined) {
        ddnEle.click();
      }
    }

    const requestInProgressEle: HTMLElement = document.getElementById('requestInProgress') as HTMLElement;
    if (requestInProgressEle !== null) {
      requestInProgressEle.innerHTML = '';
    }
  }

  getAvailablePlugins(type: string) {
    this.requestInProgress = true;
    this.fetchPluginRequestStarted();
    this.service.getAvailablePlugins(type).
      subscribe(
        (data: any) => {
          this.pluginData = data['plugins'].map((p: string) => p.replace(`foglamp-filter-`, ''));
          this.fetchPluginRequestDone();
          this.requestInProgress = false;
          if (isEmpty(this.pluginData)) {
            this.alertService.warning('No plugin available to install');
          }
        },
        error => {
          this.fetchPluginRequestDone();
          this.requestInProgress = false;
          if (error.status === 0) {
            console.log('service down ', error);
          } else if (error.status === 404) {
            this.alertService.error('Make sure package repository is configured / added in FogLAMP');
          } else {
            let errorText = error.statusText;
            if (typeof error.error.link === 'string') {
              errorText += ` <a>${error.error.link}</a>`;
            }
            this.alertService.error(errorText);
          }
        }
      );
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

  gotoNext() {
    const pluginToInstall = this.serviceForm.value['pluginToInstall'];
    const isPluginInstalled = this.plugins.filter(p => p.name.toLowerCase() === pluginToInstall.toLowerCase());
    if (this.serviceForm.value['pluginToInstall'] && isPluginInstalled.length === 0) {
      if (this.serviceForm.value['name'].trim() === '') {
        this.isValidName = false;
        return;
      }
      this.installPlugin(this.serviceForm.value['pluginToInstall']);
    } else {
      this.moveNext();
    }
  }

  moveNext() {
    this.isValidPlugin = true;
    this.isValidName = true;
    const formValues = this.serviceForm.value;
    const first = <HTMLElement>document.getElementsByClassName('step-item is-active')[0];
    if (first === undefined) {
      return;
    }
    const id = first.getAttribute('id');
    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const previousButton = <HTMLButtonElement>document.getElementById('previous');

    switch (+id) {
      case 1:
        if (formValues['plugin'] === '' && formValues['pluginToInstall'] === '') {
          this.isValidPlugin = false;
          return;
        }

        if (formValues['plugin'].length !== 1 && formValues['pluginToInstall'] === '') {
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
        if (formValues['name'].trim() !== '' && (formValues['plugin'].length > 0 || formValues['pluginToInstall'].length > 0)) {
          let pluginValue;
          if (formValues['pluginToInstall']) {
            pluginValue = this.plugins.find(p => p.name.toLowerCase() === formValues['pluginToInstall'].toLowerCase()).name;
          } else {
            pluginValue = formValues['plugin'][0];
          }
          this.payload = {
            name: formValues['name'],
            plugin: pluginValue
          };

        }
        this.getConfiguration(formValues['name'].trim());
        nxtButton.textContent = 'Done';
        previousButton.textContent = 'Previous';
        break;
      case 2:
        if (!(this.validateFormService.checkViewConfigItemFormValidity(this.viewConfigItem))) {
          return;
        }
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

  installPlugin(pluginName: string) {
    if (pluginName === undefined) {
      return;
    }
    const pluginData = {
      format: 'repository',
      name: `foglamp-filter-` + pluginName,
      version: ''
    };

    /** request started */
    this.ngProgress.start();
    this.alertService.activityMessage('installing ...', true);
    this.service.installPlugin(pluginData).
      subscribe(
        (data: any) => {
          /** request done */
          this.ngProgress.done();
          this.alertService.closeMessage();
          this.alertService.success(data.message, true);
          this.getInstalledFilterPlugins(true);
        },
        error => {
          /** request done */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
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
      if (p.name.toLowerCase() === this.payload.plugin.toLowerCase()) {
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

  public getInstalledFilterPlugins(pluginInstalled?: boolean) {
    this.filterService.getInstalledFilterPlugins().subscribe(
      (data: any) => {
        this.plugins = sortBy(data.plugins, p => {
          return p.name.toLowerCase();
        });
        if (pluginInstalled) {
          this.moveNext();
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

  filterSelectionChanged(event: any) {
    if (event.value !== undefined) {
      this.isValidPlugin = true;
    } else {
      this.serviceForm.controls['pluginToInstall'].setValue('');
    }
  }
}
