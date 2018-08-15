import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgProgress } from 'ngx-progressbar';

import { Router } from '@angular/router';
import { AlertService, ConfigurationService, SchedulesService, ServicesHealthService } from '../../../../services';

@Component({
  selector: 'app-add-service-wizard',
  templateUrl: './add-service-wizard.component.html',
  styleUrls: ['./add-service-wizard.component.css']
})
export class AddServiceWizardComponent implements OnInit {

  public plugins = [];
  public configurationData;
  public serviceId;
  public isServiceEnabled = false;
  public isServiceAdded = false;
  public isValidPlugin = false;
  public isValidName = true;
  public addServiceMsg = '';
  public enableServiceMsg = '';

  serviceForm = new FormGroup({
    name: new FormControl(),
    // type: new FormControl(),
    plugin: new FormControl()
  });

  @Input() categoryConfigurationData;

  constructor(private formBuilder: FormBuilder,
    private servicesHealthService: ServicesHealthService,
    private alertService: AlertService,
    private configService: ConfigurationService,
    private schedulesService: SchedulesService,
    private router: Router,
    private ngProgress: NgProgress) { }

  ngOnInit() {
    this.serviceForm = this.formBuilder.group({
      name: ['', Validators.required],
      // type: ['', Validators.required],
      plugin: ['', Validators.required]
    });
    // this.serviceForm.get('type').setValue('south');
    this.serviceForm.get('plugin').setValue('select');
  }

  movePrevious() {
    const last = <HTMLElement>document.getElementsByClassName('is-active')[0];
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
      nextContent.setAttribute('class', 'box step-content  is-active');
    }

    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const previousButton = <HTMLButtonElement>document.getElementById('previous');

    switch (+id) {
      case 1:
        this.serviceForm.get('name').setValue('');
        // this.serviceForm.get('type').setValue('south');
        nxtButton.textContent = 'Next';
        nxtButton.disabled = false;
        break;
      case 2:
        this.serviceForm.get('plugin').setValue('select');
        nxtButton.textContent = 'Next';
        previousButton.disabled = true;
        break;
      case 3:
        nxtButton.textContent = 'Add Service';
        nxtButton.disabled = false;
        break;
      case 4:
        nxtButton.textContent = 'Enable & Start Service';
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
        if (this.serviceForm.controls.name.value.trim().length === 0) {
          this.isValidName = false;
          return;
        }
        nxtButton.textContent = 'Add Service';
        previousButton.disabled = false;
        if (formValues['name'] !== '') {
          this.servicesHealthService.getInstalledPlugins('south').subscribe(
            (data: any) => {
              this.plugins = data.plugins;
            },
            (error) => {
              if (error.status === 0) {
                console.log('service down ', error);
              } else {
                this.alertService.error(error.statusText);
              }
            });
        }
        break;
      case 2:
        if (this.serviceForm.controls.plugin.value === 'select') {
          this.isValidPlugin = false;
          return;
        }
        nxtButton.textContent = 'Enable & Start Service';
        if (formValues['name'] !== '' && formValues['plugin'].length > 0 && formValues['plugin'] !== 'select') {
          this.isServiceAdded = true;
          this.addService(formValues, nxtButton);
        }
        break;
      case 3:
        nxtButton.textContent = 'Done';
        if (this.serviceId.length > 0) {
          /** request started */
          this.ngProgress.start();
          this.schedulesService.enableSchedule(this.serviceId).
            subscribe(
              () => {
                /** request completed */
                this.ngProgress.done();
                this.isServiceEnabled = true;
                this.enableServiceMsg = 'Service enabled and started successfully.';
                this.alertService.success(this.enableServiceMsg);
                previousButton.disabled = true;
              },
              error => {
                previousButton.disabled = false;
                this.isServiceEnabled = false;
                /** request completed */
                this.ngProgress.done();
                if (error.status === 0) {
                  console.log('service down ', error);
                } else {
                  this.enableServiceMsg = error.statusText;
                  this.alertService.error(error.statusText);
                }
              });
        }
        break;
      case 4:
        this.router.navigate(['/south']);
        break;
      default:
        break;
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

  addService(formValues, nxtButton) {
    /** request started */
    this.ngProgress.start();
    this.servicesHealthService.addService(formValues)
      .subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success('Service added successfully.');
          this.getCategory(data['name']);
          this.serviceId = data['id'];
          this.isServiceAdded = true;
          nxtButton.disabled = false;
        },
        (error) => {
          /** request completed */
          this.ngProgress.done();
          nxtButton.disabled = true;
          this.isServiceAdded = false;
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.addServiceMsg = error.statusText;
            this.alertService.error(error.statusText);
          }
        });
  }

  private getCategory(categoryName: string): void {
    this.configurationData = [];
    /** request started */
    this.ngProgress.start();
    this.configService.getCategory(categoryName).
      subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          this.configurationData = {
            value: [data],
            key: categoryName
          };
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

  validatePluginValue(event) {
    if (event.target.value !== 'select') {
      this.isValidPlugin = true;
    }
  }

  validateServiceName(event) {
    if (event.target.value.trim().length > 0) {
      this.isValidName = true;
    }
  }
}
