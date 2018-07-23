import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, ConfigurationService, ServicesHealthService, SchedulesService } from '../../../../services';

@Component({
  selector: 'app-add-service-wizard',
  templateUrl: './add-service-wizard.component.html',
  styleUrls: ['./add-service-wizard.component.css']
})
export class AddServiceWizardComponent implements OnInit {

  public plugins = [];
  public configurationData = [];
  public serviceId;
  public isServiceEnabled = false;

  serviceForm = new FormGroup({
    name: new FormControl(),
    type: new FormControl(),
    plugin: new FormControl()
  });

  constructor(private formBuilder: FormBuilder,
    private servicesHealthService: ServicesHealthService,
    private alertService: AlertService,
    private configService: ConfigurationService,
    private schedulesService: SchedulesService,
    private ngProgress: NgProgress) { }

  ngOnInit() {
    this.serviceForm = this.formBuilder.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      plugin: ['', Validators.required]
    });
    this.serviceForm.get('type').setValue('south');
    this.serviceForm.get('plugin').setValue('select');
  }

  movePrevious() {
    const last = <HTMLElement>document.getElementsByClassName('is-active')[0];
    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const id = last.getAttribute('id');
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
      nextContent.setAttribute('class', 'step-content has-text-centered is-active');
    }
    if (+id === 2) {
      this.serviceForm.get('plugin').setValue('select');
      const previousButton = <HTMLButtonElement>document.getElementById('previous');
      previousButton.disabled = true;
    }

    if (+id === 4) {
      nxtButton.textContent = 'Enable & Start Service';
      nxtButton.disabled = false;
    } else {
      nxtButton.textContent = 'Next';
    }

    if (+id !== 4) {
      this.serviceForm.get('name').setValue('');
      this.serviceForm.get('type').setValue('south');
      const nextButton = <HTMLButtonElement>document.getElementById('next');
      nextButton.disabled = false;
    }
  }

  moveNext() {
    const formValues = this.serviceForm.value;
    const first = <HTMLElement>document.getElementsByClassName('is-active')[0];
    const id = first.getAttribute('id');
    const nxtButton = <HTMLButtonElement>document.getElementById('next');

    if (+id === 1) {
      const previousButton = <HTMLButtonElement>document.getElementById('previous');
      previousButton.disabled = false;
    }

    if (+id === 2) {
      nxtButton.textContent = 'Enable & Start Service';
    }

    if (+id === 3) {
      nxtButton.disabled = true;
      nxtButton.textContent = 'Done';
    }

    if (formValues['name'] !== '' && formValues['type'] !== '' && formValues['plugin'] === 'select') {
      this.servicesHealthService.getPlugins(formValues['type']).subscribe(
        (data: any) => {
          this.plugins = data.plugins;
          console.log(this.plugins);
        },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
    }

    if (formValues['plugin'].length > 0 && formValues['plugin'] !== 'select' && +id === 2) {
      this.addService(formValues);
    }

    if (+id === 3) {
      this.schedulesService.enableSchedule(this.serviceId).
        subscribe(
          (data) => {
            /** request completed */
            this.ngProgress.done();
            this.alertService.success(data['message']);
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

    first.classList.remove('is-active');
    first.classList.add('is-completed');

    const sId = +id + 1;
    const next = <HTMLElement>document.getElementById('' + sId);
    next.setAttribute('class', 'step-item is-active');

    const stepContent = <HTMLElement>document.getElementById('c-' + id);
    stepContent.classList.remove('is-active');

    const nextContent = <HTMLElement>document.getElementById('c-' + sId);
    if (nextContent != null) {
      nextContent.setAttribute('class', 'step-content has-text-centered is-active');
    }
  }

  addService(formValues) {
    this.servicesHealthService.addService(formValues)
      .subscribe(
        (data) => {
          this.alertService.success('Service added successfully.');
          this.getCategory(data['name']);
          this.serviceId = data['id'];
          this.isServiceEnabled = true;
        },
        (error) => {
          this.isServiceEnabled = false;
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  private getCategory(categoryName: string): void {
    this.configurationData = [];
    this.configService.getCategory(categoryName).
      subscribe(
        (data: any) => {
          this.configurationData.push(data);
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  isObject(val) { return typeof val === 'object'; }

  public onTextChange(configItemKey: string) {
    const cancelButton = <HTMLButtonElement>document.getElementById('btn-cancel-' + configItemKey.toLowerCase());
    cancelButton.classList.remove('hidden');
  }

  public restoreConfigFieldValue(configItemKey: string) {
    const inputField = <HTMLInputElement>document.getElementById(configItemKey.toLowerCase());
    inputField.value = inputField.textContent;
    const cancelButton = <HTMLButtonElement>document.getElementById('btn-cancel-' + configItemKey.toLowerCase());
    cancelButton.classList.add('hidden');
  }

  public saveConfigValue(configItem: string, type: string) {
    const catItemId = (configItem.trim()).toLowerCase();
    const inputField = <HTMLInputElement>document.getElementById(catItemId);
    const value = inputField.value.trim();
    const id = inputField.id.trim();
    const cancelButton = <HTMLButtonElement>document.getElementById('btn-cancel-' + id);
    cancelButton.classList.add('hidden');
    const categoryName = this.serviceForm.value['name'];
    /** request started */
    this.ngProgress.start();
    this.configService.saveConfigItem(categoryName, configItem, value, type).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          if (data['value'] !== undefined) {
            if (type.toUpperCase() === 'JSON') {
              inputField.textContent = inputField.value = JSON.stringify(data['value']);
            } else {
              inputField.textContent = inputField.value = data['value'];
            }
            this.alertService.success('Value updated successfully');
          }
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
