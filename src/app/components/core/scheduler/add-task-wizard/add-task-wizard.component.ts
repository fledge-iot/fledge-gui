import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgProgress } from 'ngx-progressbar';

import { Router } from '../../../../../../node_modules/@angular/router';
import { AlertService, ConfigurationService, SchedulesService, ServicesHealthService } from '../../../../services';

@Component({
  selector: 'app-add-task-wizard',
  templateUrl: './add-task-wizard.component.html',
  styleUrls: ['./add-task-wizard.component.css']
})
export class AddTaskWizardComponent implements OnInit {

  public plugins = [];
  public scheduleType = [];
  public configurationData;
  public taskId;
  public isTaskEnabled = false;
  public isTaskAdded = false;
  public isValidName = true;
  public addTaskMsg = '';
  public enableTaskMsg = '';

  taskForm = new FormGroup({
    name: new FormControl(),
    type: new FormControl(),
    plugin: new FormControl(),
    schedule_type: new FormControl()
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
    this.taskForm = this.formBuilder.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      plugin: ['', Validators.required],
      schedule_type: ['', Validators.required]
    });
    this.taskForm.get('type').setValue('north');
    this.taskForm.get('schedule_type').setValue(3);
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
        this.taskForm.get('name').setValue('');
        this.taskForm.get('type').setValue('north');
        nxtButton.textContent = 'Next';
        nxtButton.disabled = false;
        break;
      case 2:
        this.taskForm.get('plugin').setValue(this.plugins[0].name);
        this.taskForm.get('schedule_type').setValue(3);
        nxtButton.textContent = 'Next';
        previousButton.disabled = true;
        break;
      case 3:
        nxtButton.textContent = 'Add Task';
        nxtButton.disabled = false;
        break;
      case 4:
        nxtButton.textContent = 'Enable & Start Task';
        nxtButton.disabled = false;
        break;
      default:
        break;
    }
  }

  moveNext() {
    this.isValidName = true;
    const formValues = this.taskForm.value;
    const first = <HTMLElement>document.getElementsByClassName('is-active')[0];
    const id = first.getAttribute('id');
    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const previousButton = <HTMLButtonElement>document.getElementById('previous');

    switch (+id) {
      case 1:
        if (this.taskForm.controls.name.value.trim().length === 0) {
          this.isValidName = false;
          return;
        }
        nxtButton.textContent = 'Add Task';
        previousButton.disabled = false;
        if (formValues['name'] !== '' && formValues['type'] !== '') {
          this.servicesHealthService.getInstalledPlugins(formValues['type']).subscribe(
            (data: any) => {
              this.plugins = data.plugins;
              this.taskForm.get('plugin').setValue(this.plugins[0].name);
            },
            (error) => {
              if (error.status === 0) {
                console.log('service down ', error);
              } else {
                this.alertService.error(error.statusText);
              }
            });
          this.getScheduleType();
        }
        break;
      case 2:
        nxtButton.textContent = 'Enable & Start Task';
        if (formValues['name'] !== '' && formValues['plugin'].length > 0) {
          this.isTaskAdded = true;
          this.addScheduledTask(formValues, nxtButton);
        }
        break;
      case 3:
        nxtButton.textContent = 'Done';
        if (this.taskId.length > 0) {
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
                previousButton.disabled = true;
              },
              error => {
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
        }
        break;
      case 4:
        this.router.navigate(['/scheduled-task']);
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

  addScheduledTask(formValues, nxtButton) {
    /** request started */
    this.ngProgress.start();
    formValues['schedule_enabled'] = false,
    formValues['schedule_repeat'] = 30,
    formValues['cmd_params'] = { 'stream_id': '1', 'debug_level': '1' };
    this.schedulesService.createTask(formValues)
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

  public getScheduleType() {
    this.scheduleType = [{ name: 'INTERVAL', index: 3 }];
  }

  validateTaskName(event) {
    if (event.target.value.trim().length > 0) {
      this.isValidName = true;
    }
  }
}
