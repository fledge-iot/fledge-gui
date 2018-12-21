import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { assign, cloneDeep, map, reduce, sortBy } from 'lodash';

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

        if (formValues['plugin'].length > 1) {
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
        this.getConfiguration();
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

  /**
   *  Get default configuration of a selected plugin
   */
  private getConfiguration(): void {
    const config = this.plugins.map(p => {
      if (p.name === this.payload.plugin) {
        return p.config;
      }
    }).filter(value => value !== undefined);

    // array to hold data to display on configuration page
    this.configurationData = { 'value': config };
    this.useProxy = 'true';
  }

  /**
   * Get edited configuration from view filter config child page
   * @param changedConfig changed configuration of a selected plugin
   */
  getChangedConfig(changedConfig) {
    const defaultConfig = map(this.configurationData.value[0], (v, key) => ({ key, ...v }));

    // make a copy of matched config items having changed values
    const matchedConfig = defaultConfig.filter(e1 => {
      return changedConfig.some(e2 => {
        return e1.key === e2.key;
      });
    });

    // make a deep clone copy of matchedConfig array to remove extra keys(not required in payload)
    const matchedConfigCopy = cloneDeep(matchedConfig);
    /**
     * merge new configuration with old configuration,
     * where value key hold changed data in config object
    */
    matchedConfigCopy.forEach(e => {
      changedConfig.forEach(c => {
        if (e.key === c.key) {
          e.value = c.value.toString();
        }
      });
    });

    // final array to hold changed configuration
    let finalConfig = [];
    matchedConfigCopy.forEach(item => {
      finalConfig.push({
        [item.key]: item.type === 'JSON' ? JSON.parse(item.value) : item.value
      });
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

  public addFilterPipeline(payload) {
    this.filterService.addFilterPipeline(payload, this.serviceName)
      .subscribe((data: any) => {
        this.notify.emit(data);
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
        console.log('data.plugins', data.plugins);
        this.plugins = sortBy(data.plugins, p => {
          return p.name;
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
