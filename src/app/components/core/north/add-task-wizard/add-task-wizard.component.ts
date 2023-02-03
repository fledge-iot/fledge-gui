import { Component, Input, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { cloneDeep, sortBy } from 'lodash';
import { Subscription } from 'rxjs';

import {
  AlertService, SchedulesService, SharedService, PluginService, ProgressBarService,
  ServicesApiService, FileUploaderService, ConfigurationControlService
} from '../../../../services';
import Utils from '../../../../utils';
import { ViewLogsComponent } from '../../logs/packages-log/view-logs/view-logs.component';
import { DocService } from '../../../../services/doc.service';

@Component({
  selector: 'app-add-task-wizard',
  templateUrl: './add-task-wizard.component.html',
  styleUrls: ['./add-task-wizard.component.css']
})
export class AddTaskWizardComponent implements OnInit, OnDestroy {

  public plugins = [];
  public configurationData;
  public pluginConfiguration: any;
  public isValidName = true;
  public isValidPlugin = true;
  public isSinglePlugin = true;
  public isValidDay = true;
  public isValidTime = true;
  public isScheduleEnabled = true;
  public payload: any;
  public schedulesName = [];
  public selectedPluginDescription = '';
  public plugin: any;
  public showSpinner = false;
  public isService = false;
  private subscription: Subscription;
  public taskType = 'North';
  // to hold child form state
  validConfigurationForm = true;

  taskForm = new FormGroup({
    name: new FormControl('', Validators.required),
    plugin: new FormControl('', Validators.required),
    repeatDays: new FormControl('', [Validators.required, Validators.min(0), Validators.max(365)]),
    repeatTime: new FormControl('', [Validators.required])
  });

  regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$';  // Regex to verify time format 00:00:00
  @Input() categoryConfigurationData;
  @ViewChild(ViewLogsComponent) viewLogsComponent: ViewLogsComponent;

  public pluginData = {
    modalState: false,
    type: this.taskType,
    pluginName: ''
  };

  constructor(private pluginService: PluginService,
    private alertService: AlertService,
    private schedulesService: SchedulesService,
    private router: Router,
    private ngProgress: ProgressBarService,
    private sharedService: SharedService,
    private servicesApiService: ServicesApiService,
    private docService: DocService,
    private fileUploaderService: FileUploaderService,
    private configurationControlService: ConfigurationControlService
  ) { }

  ngOnInit() {
    this.getSchedules();
    this.taskForm.get('repeatDays').setValue('0');
    this.taskForm.get('repeatTime').setValue('00:00:30');
    this.getInstalledNorthPlugins();
    this.subscription = this.sharedService.showLogs.subscribe(showPackageLogs => {
      if (showPackageLogs.isSubscribed) {
        // const closeBtn = <HTMLDivElement>document.querySelector('.modal .delete');
        // if (closeBtn) {
        //   closeBtn.click();
        // }
        this.viewLogsComponent.toggleModal(true, showPackageLogs.fileLink);
        showPackageLogs.isSubscribed = false;
      }
    });
  }

  movePrevious() {
    const last = <HTMLElement>document.getElementsByClassName('step-item is-active')[0];
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
          this.alertService.error('A service/task already exists with this name.');
          return false;
        }

        if (formValues['name'] !== '' && formValues['plugin'].length > 0 && formValues['repeatTime'].length > 0) {
          this.payload = {
            'name': formValues['name'],
            'plugin': formValues['plugin'][0],
            'type': this.taskType.toLowerCase(),
            'schedule_repeat': repeatTime,
            'schedule_type': '3',
            'schedule_enabled': this.isScheduleEnabled
          };
        }
        this.getConfiguration();
        break;
      case 2:
        nxtButton.textContent = 'Done';
        previousButton.textContent = 'Previous';
        break;
      case 3:
        if (this.isService) {
          delete this.payload.schedule_repeat;
          delete this.payload.schedule_type;
          delete this.payload.schedule_enabled;
          this.payload.enabled = this.isScheduleEnabled;
          this.addService(this.payload);
        } else {
          this.addScheduledTask(this.payload);
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

  /**
   * Open plugin modal
   */
  openPluginModal() {
    this.pluginData = {
      modalState: true,
      type: this.taskType,
      pluginName: ''
    };
  }

  private getInstalledNorthPlugins(isPluginInstalled?: boolean) {
    /** request started */
    this.showLoadingSpinner();
    this.pluginService.getInstalledPlugins(this.taskType.toLowerCase()).subscribe(
      (data: any) => {
        /** request completed */
        this.hideLoadingSpinner();
        this.plugins = sortBy(data.plugins, p => {
          return p.name.toLowerCase();
        });
      },
      (error) => {
        /** request completed */
        this.hideLoadingSpinner();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      },
      () => {
        setTimeout(() => {
          if (isPluginInstalled) {
            this.selectInstalledPlugin();
          }
        }, 1000);
      });
  }

  /**
   *  Get default configuration of a selected plugin
   */
  private getConfiguration(): void {
    const plugin = this.plugins.find(p => p.name === this.payload.plugin);
    if (plugin) {
      this.configurationData = plugin;
      this.pluginConfiguration = cloneDeep(plugin);
    }
  }

  private addScheduledTask(payload) {
    // extract script files to upload from final payload
    const files = this.getScriptFilesToUpload(payload.config);

    this.taskForm.get('name').markAsTouched();
    /** request started */
    this.ngProgress.start();
    this.schedulesService.createScheduledTask(payload)
      .subscribe(
        () => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success('North instance added successfully.', true);
          if (files.length > 0) {
            const name = this.payload.name
            this.uploadScript(name, files);
          }
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

  getScriptFilesToUpload(configuration: any) {
    return this.fileUploaderService.getConfigurationPropertyFiles(configuration, true);
  }

  public addService(payload) {
    // extract script files to upload from final payload
    const files = this.getScriptFilesToUpload(payload.config);

    this.taskForm.get('name').markAsTouched();
    /** request started */
    this.ngProgress.start();
    this.servicesApiService.addService(payload)
      .subscribe(
        (response) => {
          /** request done */
          this.ngProgress.done();
          this.alertService.success(response['name'] + ' service added successfully.', true);
          if (files.length > 0) {
            const name = this.payload.name
            this.uploadScript(name, files);
          }
          this.router.navigate(['/north']);
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

  /**
  * To upload script files of a configuration property
  * @param categoryName name of the configuration category
  * @param files : Scripts array to uplaod
  */
  public uploadScript(categoryName: string, files: any[]) {
    this.fileUploaderService.uploadConfigurationScript(categoryName, files);
  }

  /**
   * Get edited configuration from view config child page
   * @param changedConfig changed configuration of a selected plugin
   */
  getChangedConfig(changedConfig: any) {
    this.payload.config = this.configurationControlService.getChangedConfiguration(changedConfig, this.pluginConfiguration, true);;
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

  getDescription(selectedPlugin) {
    if (selectedPlugin === '') {
      this.isValidPlugin = false;
      this.selectedPluginDescription = '';
      this.taskForm.value['plugin'] = '';
    } else {
      this.isSinglePlugin = true;
      this.isValidPlugin = true;
      this.plugin = (selectedPlugin.slice(3).trim()).replace(/'/g, '');
      this.selectedPluginDescription = this.plugins.find(p => p.name === this.plugin).description;
    }
  }

  onCheckboxClicked(event) {
    this.isScheduleEnabled = event.target.checked ? true : false;
    this.payload.schedule_enabled = this.isScheduleEnabled;
  }

  onServiceCheckboxClicked(event) {
    this.isService = event.target.checked ? true : false;
  }

  public getSchedules(): void {
    this.schedulesName = [];
    /** request started */
    this.ngProgress.start();
    this.schedulesService.getSchedules().
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
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

  onNotify(event: any) {
    this.pluginData.modalState = event.modalState;
    this.pluginData.pluginName = event.name;
    if (event.pluginInstall) {
      this.getInstalledNorthPlugins(event.pluginInstall);
    }
  }

  selectInstalledPlugin() {
    const select = <HTMLSelectElement>document.getElementById('pluginSelect');
    if (select) {
      for (let i = 0, j = select.options.length; i < j; ++i) {
        if (select.options[i].innerText.toLowerCase() === this.pluginData.pluginName.toLowerCase()) {
          this.taskForm.controls['plugin'].setValue([this.plugins[i].name]);
          select.selectedIndex = i;
          select.dispatchEvent(new Event('change'));
          break;
        }
      }
    }
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  goToLink() {
    const pluginInfo = {
      name: this.plugin,
      type: 'North'
    };
    this.docService.goToPluginLink(pluginInfo);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
