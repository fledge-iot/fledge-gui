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
  public isValidPlugin = true;
  public isSinglePlugin = true;
  public isValidName = true;
  public addServiceMsg = '';
  public enableServiceMsg = '';
  public selectedPlugins = [];

  public serviceType = 'South';

  serviceForm = new FormGroup({
    name: new FormControl(),
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
        nxtButton.textContent = 'Done';
        previousButton.textContent = 'Previous';
        if (formValues['name'].trim() !== '' && formValues['plugin'].length > 0) {
          const payload = {
            name: formValues['name'],
            type: this.serviceType,
            plugin: formValues['plugin'][0]
          };
          this.isServiceAdded = true;
          this.addService(payload, nxtButton);
        }
        break;
      case 2:
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
                this.router.navigate(['/south']);
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

  addService(payload, nxtButton) {
    /** request started */
    this.ngProgress.start();
    this.servicesHealthService.addService(payload)
      .subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success('Service added successfully.', true);
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
}
