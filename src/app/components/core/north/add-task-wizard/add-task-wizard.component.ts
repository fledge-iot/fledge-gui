import { Component, Input, OnInit, ViewChild, OnDestroy, ChangeDetectorRef, EventEmitter } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { cloneDeep, sortBy } from 'lodash';
import { Subscription } from 'rxjs';

import {
  AlertService, SchedulesService, SharedService, PluginService, ProgressBarService,
  ServicesApiService, FileUploaderService, ConfigurationControlService
} from '../../../../services';
import Utils, { QUOTATION_VALIDATION_PATTERN } from '../../../../utils';
import { ViewLogsComponent } from '../../logs/packages-log/view-logs/view-logs.component';
import { DocService } from '../../../../services/doc.service';
import { CustomValidator } from '../../../../directives/custom-validator';

@Component({
  selector: 'app-add-task-wizard',
  templateUrl: './add-task-wizard.component.html',
  styleUrls: ['./add-task-wizard.component.css']
})
export class AddTaskWizardComponent implements OnInit, OnDestroy {

  public plugins = [];
  public configurationData;
  public pluginConfiguration: any;
  public isScheduleEnabled = true;
  public schedulesName = [];
  public selectedPluginDescription = '';
  public plugin: any;
  public showSpinner = false;
  public isService = false;
  private subscription: Subscription;
  public taskType = 'North';
  public source = '';
  public isTabsNavVisible = false;

  // to hold child form state
  validConfigurationForm = true;
  QUOTATION_VALIDATION_PATTERN = QUOTATION_VALIDATION_PATTERN;

  taskForm = new UntypedFormGroup({
    name: new UntypedFormControl('', [Validators.required, CustomValidator.nospaceValidator]),
    plugin: new UntypedFormControl('', [Validators.required, CustomValidator.pluginsCountValidator]),
    repeatDays: new UntypedFormControl('', [Validators.required, Validators.min(0), Validators.max(365)]),
    repeatTime: new UntypedFormControl('', [Validators.required]),
    config: new UntypedFormControl(null)
  });

  regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$';  // Regex to verify time format 00:00:00
  @Input() categoryConfigurationData;
  @ViewChild(ViewLogsComponent) viewLogsComponent: ViewLogsComponent;

  public pluginData = {
    modalState: false,
    type: this.taskType,
    pluginName: ''
  };

  public reenableButton = new EventEmitter<boolean>(false);

  constructor(private pluginService: PluginService,
    private alertService: AlertService,
    private schedulesService: SchedulesService,
    private router: Router,
    private route: ActivatedRoute,
    private ngProgress: ProgressBarService,
    private sharedService: SharedService,
    private servicesApiService: ServicesApiService,
    private docService: DocService,
    private fileUploaderService: FileUploaderService,
    private configurationControlService: ConfigurationControlService,
    private cdRef: ChangeDetectorRef
  ) {
    this.route.queryParams.subscribe(params => {
      if (params['source']) {
        this.source = params['source'];
      }
    });
  }

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
      if (this.source) {
        this.router.navigate(['/flow/editor/north'])
      } else {
        this.router.navigate(['/north']);
      }
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
      this.isTabsNavVisible = sId == 2 ? true : false;
      nextContent.setAttribute('class', 'box step-content  is-active');
    }

    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const previousButton = <HTMLButtonElement>document.getElementById('previous');

    switch (+id) {
      case 2:
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Cancel';
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
    const formValues = this.taskForm.value;
    const first = <HTMLElement>document.getElementsByClassName('step-item is-active')[0];
    const id = first.getAttribute('id');
    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const previousButton = <HTMLButtonElement>document.getElementById('previous');

    switch (+id) {
      case 1:
        // To verify if task with given name already exist
        const isTaskNameExist = this.schedulesName.some(item => {
          return formValues['name'].trim() === item.name;
        });
        if (isTaskNameExist) {
          this.alertService.error('A service/task already exists with this name.');
          this.reenableButton.emit(false);
          return false;
        }
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Previous';
        previousButton.disabled = false;

        // check if configuration form is valid or invalid
        this.validConfigurationForm ? nxtButton.disabled = false : nxtButton.disabled = true;

        this.isTabsNavVisible = true;
        break;
      case 2:
        this.reenableButton.emit(false);
        nxtButton.textContent = 'Done';
        previousButton.textContent = 'Previous';
        break;
      case 3:
        if (this.isService) {
          this.addService();
        } else {
          this.addScheduledTask();
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

  private addScheduledTask() {

    const repeatTime = this.taskForm.value['repeatTime'] !== ('' || undefined) ? Utils.convertTimeToSec(
      this.taskForm.value['repeatTime'], this.taskForm.value['repeatDays']) : 0;
    const config = this.taskForm.value['config'];
    const payload = {
      name: this.taskForm.value['name'].trim(),
      type: this.taskType.toLowerCase(),
      plugin: this.taskForm.value['plugin'][0],
      ...config && { config },
      schedule_type: '3',
      schedule_repeat: repeatTime,
      schedule_enabled: this.isScheduleEnabled
    };

    // extract script files to upload from final payload
    const files = this.getScriptFilesToUpload(payload.config);

    /** request started */
    this.ngProgress.start();
    this.schedulesService.createScheduledTask(payload)
      .subscribe(
        (response) => {
          /** request completed */
          this.ngProgress.done();
          this.reenableButton.emit(false);
          this.alertService.success('North instance added successfully.', true);
          if (files.length > 0) {
            const name = payload.name;
            this.uploadScript(name, files);
          }
          if (this.source === 'flowEditor') {
            this.router.navigate(['/flow/editor/north', response['name'], 'details'])
          }
          else {
            this.router.navigate(['/north']);
          }
        },
        (error) => {
          /** request completed */
          this.ngProgress.done();
          this.reenableButton.emit(false);
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

  addService() {
    const payload = {
      name: this.taskForm.value['name'].trim(),
      type: this.taskType.toLowerCase(),
      plugin: this.taskForm.value['plugin'][0],
      ...this.taskForm.value['config'] && { config: this.taskForm.value['config'] },
      enabled: this.isScheduleEnabled
    };

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
          this.reenableButton.emit(false);
          this.alertService.success(response['name'] + ' service added successfully.', true);
          if (files.length > 0) {
            const name = payload.name
            this.uploadScript(name, files);
          }
          if (this.source === 'flowEditor') {
            this.router.navigate(['/flow/editor/north', response['name'], 'details']);
          }
          else {
            this.router.navigate(['/north']);
          }
        },
        (error) => {
          /** request done */
          this.ngProgress.done();
          this.reenableButton.emit(false);
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
    const config = this.configurationControlService.getChangedConfiguration(changedConfig, this.pluginConfiguration, true);
    this.taskForm.controls['config'].patchValue(config);
    this.taskForm.controls['config'].updateValueAndValidity({ onlySelf: true });
  }


  setRepeatIntervalValue(event) {
    this.taskForm.controls['repeatTime'].patchValue(event.target.value.trim());
    this.taskForm.controls['repeatTime'].updateValueAndValidity({ onlySelf: true });
  }

  selectPlugin(selectedPlugin: string) {
    this.validConfigurationForm = true;
    this.configurationData = null;
    this.pluginConfiguration = null;
    this.plugin = (selectedPlugin.slice(3).trim()).replace(/'/g, '');
    const pluginInfo = cloneDeep(this.plugins?.find(p => p.name === this.plugin));
    if (pluginInfo) {
      pluginInfo.config = this.configurationControlService.getValidConfig(pluginInfo.config);
      this.configurationData = pluginInfo;
      this.pluginConfiguration = cloneDeep(pluginInfo);
      this.selectedPluginDescription = pluginInfo.description;
      this.taskForm.controls['config'].patchValue(pluginInfo?.config);
      this.taskForm.controls['config'].updateValueAndValidity({ onlySelf: true });
      this.isScheduleEnabled = true; // set to default
      this.cdRef.detectChanges();
    }
  }

  onCheckboxClicked(event) {
    this.isScheduleEnabled = event.target.checked ? true : false;
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
