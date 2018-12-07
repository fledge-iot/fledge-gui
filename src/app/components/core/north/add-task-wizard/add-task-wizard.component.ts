import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, ConfigurationService, SchedulesService, ServicesHealthService } from '../../../../services';
import Utils from '../../../../utils';
import { ViewConfigItemComponent } from '../../configuration-manager/view-config-item/view-config-item.component';

@Component({
  selector: 'app-add-task-wizard',
  templateUrl: './add-task-wizard.component.html',
  styleUrls: ['./add-task-wizard.component.css']
})
export class AddTaskWizardComponent implements OnInit {

  public plugins = [];
  public scheduleType = [];
  public configurationData;
  public useProxy;

  public taskId;
  public isTaskEnabled = false;
  public isTaskAdded = false;
  public isValidName = true;
  public isValidPlugin = true;
  public isSinglePlugin = true;
  public isValidDay = true;
  public isValidTime = true;
  public addTaskMsg = '';
  public enableTaskMsg = '';
  public isScheduleEnabled = true;

  taskForm = new FormGroup({
    name: new FormControl(),
    type: new FormControl(),
    plugin: new FormControl(),
    schedule_type: new FormControl(),
    repeat_day: new FormControl(),
    repeat_time: new FormControl()
  });

  @Input() categoryConfigurationData;
  @ViewChild(ViewConfigItemComponent) viewConfigItemComponent: ViewConfigItemComponent;

  constructor(private formBuilder: FormBuilder,
    private servicesHealthService: ServicesHealthService,
    private alertService: AlertService,
    private configService: ConfigurationService,
    private schedulesService: SchedulesService,
    private router: Router,
    private ngProgress: NgProgress) { }

  ngOnInit() {
    const regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$';  // Regex to verify time format 00:00:00
    this.taskForm = this.formBuilder.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      plugin: ['', Validators.required],
      schedule_type: ['', Validators.required],
      repeat_day: [Validators.min(0), Validators.max(365)],
      repeat_time: ['', [Validators.required, Validators.pattern(regExp)]],
    });
    this.taskForm.get('type').setValue('north');
    this.taskForm.get('repeat_time').setValue('00:00:30');
    this.getInstalledNorthPlugins();
  }

  movePrevious() {
    const last = <HTMLElement>document.getElementsByClassName('is-active')[0];
    const id = last.getAttribute('id');
    if (+id === 1) {
      this.router.navigate(['/north']);
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
    this.isValidName = true;
    this.isValidPlugin = true;
    this.isValidDay = true;
    this.isValidTime = true;
    const formValues = this.taskForm.value;
    const first = <HTMLElement>document.getElementsByClassName('is-active')[0];
    const id = first.getAttribute('id');
    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const previousButton = <HTMLButtonElement>document.getElementById('previous');

    switch (+id) {
      case 1:
        console.log(this.taskForm.value);
        if (formValues['plugin'] === '') {
          this.isValidPlugin = false;
          return;
        }

        if (formValues['plugin'].length > 1) {
          this.isSinglePlugin = false;
          return;
        }

        if (formValues['name'] === '') {
          this.isValidName = false;
          return;
        }
        nxtButton.textContent = 'Next';
        previousButton.disabled = false;
        if (formValues['repeat_day'] === '') {
          this.isValidDay = false;
          return;
        }
        if (formValues['repeat_time'] === '' || formValues['repeat_time'] === 0) {
          this.isValidTime = false;
          return;
        }

        const repeatTime = formValues['repeat_time'] !== ('' || undefined) ? Utils.convertTimeToSec(
          formValues['repeat_time'], formValues['repeat_day']) : 0;

        if (repeatTime === 0) {
          this.isValidTime = false;
          return;
        }

        if (formValues['name'] !== '' && formValues['plugin'].length > 0 && formValues['repeat_time'].length > 0) {
          this.isTaskAdded = true;
          this.addScheduledTask(formValues, repeatTime, nxtButton);
        }
        break;
      case 2:
        document.getElementById('vci-proxy').click();
        if (this.viewConfigItemComponent !== undefined && !this.viewConfigItemComponent.isValidForm) {
          return false;
        }
        nxtButton.textContent = 'Done';
        previousButton.textContent = 'Previous';
        break;
      case 3:
        nxtButton.style.visibility = 'hidden';
        previousButton.style.visibility = 'hidden';
        if (this.taskId.length > 0 && this.isScheduleEnabled) {
          /** request started */
          this.ngProgress.start();
          this.schedulesService.enableSchedule(this.taskId).
            subscribe(
              () => {
                /** request completed */
                this.ngProgress.done();
                this.isTaskEnabled = true;
                this.enableTaskMsg = 'Task scheduled and enabled successfully.';
                this.alertService.success(this.enableTaskMsg);
                this.router.navigate(['/north']);
              },
              error => {
                nxtButton.style.visibility = 'visible';
                previousButton.style.visibility = 'visible';
                previousButton.disabled = false;
                this.isTaskEnabled = false;
                /** request completed */
                this.ngProgress.done();
                if (error.status === 0) {
                  console.log('service down ', error);
                } else {
                  this.enableTaskMsg = error.statusText;
                  this.alertService.error(error.statusText);
                }
              });
        } else {
          this.router.navigate(['/north']);
        }
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

  private getInstalledNorthPlugins() {
    /** request started */
    this.ngProgress.start();
    this.servicesHealthService.getInstalledPlugins('north').subscribe(
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

  private addScheduledTask(formValues, repeatTime, nxtButton) {
    /** request started */
    this.ngProgress.start();

    const payload = {
      'name': formValues['name'],
      'plugin': formValues['plugin'][0],
      'type': 'north',
      'schedule_repeat': repeatTime,
      'schedule_type': '3'
    };
    this.schedulesService.createScheduledTask(payload)
      .subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success('Task added successfully.');
          this.getCategory(data['name']);
          this.taskId = data['id'];
          this.isTaskAdded = true;
          nxtButton.disabled = false;
        },
        (error) => {
          /** request completed */
          this.ngProgress.done();
          nxtButton.disabled = true;
          this.isTaskAdded = false;
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.addTaskMsg = error.statusText;
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
          this.useProxy = 'true';
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

  validateTaskName(event) {
    if (event.target.value.trim().length > 0) {
      this.isValidName = true;
    }
  }

  validateRepeatDay() {
    if (!this.taskForm.controls.repeat_day.invalid) {
      this.isValidDay = true;
    }
  }

  validateRepeatTime(event) {
    if (event.target.value.trim().length > 0 && !this.taskForm.controls.repeat_time.invalid) {
      this.isValidTime = true;
    }
  }

  changedSelectedPlugin() {
    this.isValidPlugin = true;
    this.isSinglePlugin = true;
  }

  onCheckboxClicked(event) {
    if (event.target.checked) {
      this.isScheduleEnabled = true;
    } else {
      this.isScheduleEnabled = false;
    }
  }
}
