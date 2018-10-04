import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { assign, cloneDeep, reduce } from 'lodash';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, SchedulesService, ServicesHealthService } from '../../../../services';
import { ViewConfigItemComponent } from '../../configuration-manager/view-config-item/view-config-item.component';

@Component({
  selector: 'app-add-service-wizard',
  templateUrl: './add-service-wizard.component.html',
  styleUrls: ['./add-service-wizard.component.css']
})
export class AddServiceWizardComponent implements OnInit {

  public plugins = [];
  public configurationData;
  public useProxy;
  public isValidPlugin = true;
  public isSinglePlugin = true;
  public isValidName = true;
  public serviceType = 'South';
  public isScheduleEnabled = true;
  public payload: any;
  public schedulesName = [];

  serviceForm = new FormGroup({
    name: new FormControl(),
    plugin: new FormControl()
  });

  @Input() categoryConfigurationData;
  @ViewChild(ViewConfigItemComponent) viewConfigItemComponent: ViewConfigItemComponent;

  constructor(private formBuilder: FormBuilder,
    private servicesHealthService: ServicesHealthService,
    private alertService: AlertService,
    private router: Router,
    private schedulesService: SchedulesService,
    private ngProgress: NgProgress) { }

  ngOnInit() {
    this.getSchedules();
    this.serviceForm = this.formBuilder.group({
      name: ['', Validators.required],
      plugin: ['', Validators.required]
    });
    this.getInstalledSouthPlugins();
  }

  movePrevious() {
    const last = <HTMLElement>document.getElementsByClassName('is-active')[0];
    const id = last.getAttribute('id');
    if (+id === 1) {
      this.router.navigate(['/south']);
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
      nextContent.setAttribute('class', 'box step-content  is-active');
    }

    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const previousButton = <HTMLButtonElement>document.getElementById('previous');
    switch (+id) {
      case 2:
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Back';
        nxtButton.disabled = false;
        break;
      case 3:
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
    const first = <HTMLElement>document.getElementsByClassName('is-active')[0];
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

        // To verify if service with given name already exist
        const isServiceNameExist = this.schedulesName.some(item => {
          return formValues['name'].trim() === item.name;
        });
        if (isServiceNameExist) {
          this.alertService.error('A south service or north task instance already exists with this name.');
          return false;
        }

        // create payload to pass in add service
        if (formValues['name'].trim() !== '' && formValues['plugin'].length > 0) {
          this.payload = {
            name: formValues['name'],
            type: this.serviceType,
            plugin: formValues['plugin'][0],
            enabled: this.isScheduleEnabled
          };
        }
        this.getConfiguration();
        break;
      case 2:
        this.viewConfigItemComponent.callFromWizard();
        document.getElementById('vci-proxy').click();
        if (this.viewConfigItemComponent !== undefined && !this.viewConfigItemComponent.isValidForm) {
          return false;
        }
        nxtButton.textContent = 'Done';
        previousButton.textContent = 'Previous';
        break;
      case 3:
        this.addService(this.payload);
        break;
      default:
        break;
    }

    if (+id >= 3) {
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
    this.configurationData = { value: config };
    this.useProxy = 'true';
  }

  /**
   * Get edited configuration from view config child page
   * @param changedConfig changed configuration of a selected plugin
   */
  getChangedConfig(changedConfig) {
    // make a copy of matched config items having changed values
    const matchedConfig = this.configurationData.value.filter(e1 => {
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
        [item.key]: item.type === 'JSON' ? { value: JSON.parse(item.value) } : { value: item.value }
      });
    });

    // convert finalConfig array in object of objects to pass in add service
    finalConfig = reduce(finalConfig, function (memo, current) { return assign(memo, current); }, {});
    this.payload.config = finalConfig;
  }

  /**
   * Method to add service
   * @param payload  to pass in request
   * @param nxtButton button to go next
   * @param previousButton button to go previous
   */
  public addService(payload) {
    /** request started */
    this.ngProgress.start();
    this.servicesHealthService.addService(payload)
      .subscribe(
        () => {
          /** request done */
          this.ngProgress.done();
          this.alertService.success('Service added successfully.', true);
          this.router.navigate(['/south']);
        },
        (error) => {
          /** request done */
          this.ngProgress.done();
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

  public getInstalledSouthPlugins() {
    /** request started */
    this.ngProgress.start();
    this.servicesHealthService.getInstalledPlugins('south').subscribe(
      (data: any) => {
        /** request completed */
        this.ngProgress.done();
        this.plugins = data.plugins;
      },
      (error) => {
        /** request completed */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  onCheckboxClicked(event) {
    if (event.target.checked) {
      this.isScheduleEnabled = true;
    } else {
      this.isScheduleEnabled = false;
    }
    this.payload.enabled = this.isScheduleEnabled;
  }

  public getSchedules(): void {
    this.schedulesName = [];
    /** request started */
    this.ngProgress.start();
    this.schedulesService.getSchedules().
      subscribe(
        (data) => {
          // To filter
          this.schedulesName = data['schedules'];
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

}
