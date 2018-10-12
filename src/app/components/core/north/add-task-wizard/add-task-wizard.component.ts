import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { assign, cloneDeep, reduce } from 'lodash';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, SchedulesService, ServicesHealthService } from '../../../../services';
import Utils from '../../../../utils';
import { ViewConfigItemComponent } from '../../configuration-manager/view-config-item/view-config-item.component';

@Component({
  selector: 'app-add-task-wizard',
  templateUrl: './add-task-wizard.component.html',
  styleUrls: ['./add-task-wizard.component.css']
})
export class AddTaskWizardComponent implements OnInit {

  public plugins = [];
  public configurationData;
  public useProxy;

  public isValidName = true;
  public isValidPlugin = true;
  public isSinglePlugin = true;
  public isValidDay = true;
  public isValidTime = true;
  public isScheduleEnabled = true;
  public payload: any;
  public schedulesName = [];

  taskForm = new FormGroup({
    name: new FormControl('', Validators.required),
    plugin: new FormControl('', Validators.required),
    repeatDays: new FormControl('', [Validators.required, Validators.min(0), Validators.max(365)]),
    repeatTime: new FormControl('', [Validators.required])
  });

  regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$';  // Regex to verify time format 00:00:00
  @Input() categoryConfigurationData;
  @ViewChild(ViewConfigItemComponent) viewConfigItemComponent: ViewConfigItemComponent;

  constructor(private servicesHealthService: ServicesHealthService,
    private alertService: AlertService,
    private schedulesService: SchedulesService,
    private router: Router,
    private ngProgress: NgProgress) { }

  ngOnInit() {
    this.getSchedules();
    this.taskForm.get('repeatDays').setValue('0');
    this.taskForm.get('repeatTime').setValue('00:00:30');
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
        if (formValues['repeatDays'] === null || formValues['repeatDays'] === '') {
          this.isValidDay = false;
          return;
        }
        if (formValues['repeatTime'] === '' || formValues['repeatTime'] === 0) {
          this.isValidTime = false;
          return;
        }

        const repeatTime = formValues['repeatTime'] !== ('' || undefined) ? Utils.convertTimeToSec(
          formValues['repeatTime'], formValues['repeatDays']) : 0;

        if (repeatTime === 0) {
          this.isValidTime = false;
          return;
        }

        if (this.taskForm.invalid) {
          return false;
        }

        // To verify if task with given name already exist
        const isTaskNameExist = this.schedulesName.some(item => {
          return formValues['name'].trim() === item.name;
        });
        if (isTaskNameExist) {
          this.alertService.error('A north task instance or south service already exists with this name.');
          return false;
        }

        if (formValues['name'] !== '' && formValues['plugin'].length > 0 && formValues['repeatTime'].length > 0) {
          this.payload = {
            'name': formValues['name'],
            'plugin': formValues['plugin'][0],
            'type': 'north',
            'schedule_repeat': repeatTime,
            'schedule_type': '3',
            'schedule_enabled': this.isScheduleEnabled
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
        this.addScheduledTask(this.payload);
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


  private addScheduledTask(payload) {
    this.taskForm.get('name').markAsTouched();
    /** request started */
    this.ngProgress.start();
    this.schedulesService.createScheduledTask(payload)
      .subscribe(
        () => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success('North instance added successfully.', true);
          this.router.navigate(['/north']);
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

    // convert finalConfig array in object of objects to pass in add task
    finalConfig = reduce(finalConfig, function (memo, current) { return assign(memo, current); }, {});
    this.payload.config = finalConfig;
  }

  validateTaskName(event) {
    if (event.target.value.trim().length > 0) {
      this.isValidName = true;
    }
  }

  validateRepeatDays(event) {
    if (event.target.value.trim().length > 0 && !this.taskForm.controls.repeatDays.invalid) {
      this.isValidDay = true;
    }
  }

  validateRepeatTime(event) {
    if (event.target.value.trim().length > 0 && !this.taskForm.controls.repeatTime.invalid) {
      this.isValidTime = true;
    }
  }
  setRepeatIntervalValue(event) {
    this.taskForm.controls['repeatTime'].setValue(event.target.value.trim());
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
    this.payload.schedule_enabled = this.isScheduleEnabled;
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

  get repeatTime() {
    return this.taskForm.get('repeatTime');
  }

  get repeatDays() {
    return this.taskForm.get('repeatDays');
  }

  get name() {
    return this.taskForm.get('name');
  }
}
