import {
  ChangeDetectorRef,
  Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild
} from '@angular/core';
import { UntypedFormBuilder, NgForm } from '@angular/forms';

import { cloneDeep, isEmpty, isEqual } from 'lodash';

import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertService, ConfigurationControlService, ConfigurationService,
  FileUploaderService, FilterService, NorthService, ProgressBarService,
  ResponseHandler,
  RolesService, SchedulesService, ServicesApiService, ToastService
} from '../../../../services';
import { DocService } from '../../../../services/doc.service';
import Utils from '../../../../utils';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { FilterAlertComponent } from '../../filter/filter-alert/filter-alert.component';
import { ConfigurationGroupComponent } from '../../configuration-manager/configuration-group/configuration-group.component';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { NorthTask } from '../north-task';
import { FilterListComponent } from '../../filter/filter-list/filter-list.component';

@Component({
  selector: 'app-north-task-modal',
  templateUrl: './north-task-modal.component.html',
  styleUrls: ['./north-task-modal.component.css']
})
export class NorthTaskModalComponent implements OnInit, OnChanges {
  category: any;
  enabled: Boolean;
  exclusive: Boolean;
  repeatTime: any;
  repeatDays: any;
  name: string;
  isAddFilterWizard = false;
  public applicationTagClicked = false;

  public filterPipeline: string[] = [];
  public confirmationDialogData = {};
  public btnTxt = '';

  @ViewChild('fg') form: NgForm;
  regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$';

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('pluginConfigComponent') pluginConfigComponent: ConfigurationGroupComponent;
  @ViewChild('filtersListComponent') filtersListComponent: FilterListComponent;
  @ViewChild(FilterAlertComponent) filterAlert: FilterAlertComponent;

  public reenableButton = new EventEmitter<boolean>(false);

  // to hold child form state
  validConfigurationForm = true;
  validFilterConfigForm = true;
  pluginConfiguration;
  changedConfig = {};

  advancedConfiguration = [];

  // To hold API calls to execute
  apiCallsStack = [];
  unsavedChangesInFilterForm: boolean = false;

  task: NorthTask;
  taskName = '';
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private router: Router,
    private schedulesService: SchedulesService,
    private configService: ConfigurationService,
    private alertService: AlertService,
    private northService: NorthService,
    private filterService: FilterService,
    public fb: UntypedFormBuilder,
    private dialogService: DialogService,
    public ngProgress: ProgressBarService,
    private servicesApiService: ServicesApiService,
    private docService: DocService,
    public rolesService: RolesService,
    private configurationControlService: ConfigurationControlService,
    private fileUploaderService: FileUploaderService,
    private response: ResponseHandler,
    private toast: ToastService,
    public cDRef: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
  ) {
    this.activatedRoute.paramMap.subscribe(params => {
      this.taskName = params.get('name');
      if (this.taskName) {
        this.getNorthTasks(true)
      }
    })
   }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    const alertModal = <HTMLDivElement>document.getElementById('modal-box');
    if (!alertModal.classList.contains('is-active')) {
      this.navToNorthPage();
    }
  }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes?.task?.previousValue !== changes?.task?.currentValue) {
      this.getNorthData();
    }
  }

  ngAfterViewChecked() {
    this.cDRef.detectChanges();
  }

  refreshPageData() {
    if (this.pluginConfiguration) {
      const pluginConfigCopy = cloneDeep(this.pluginConfiguration);
      this.pluginConfigComponent?.updateCategroyConfig(pluginConfigCopy.config);
    }

    if (this.form !== undefined) {
      this.enabled = this.task.enabled;
      this.exclusive = this.task.exclusive;
      const repeatInterval = Utils.secondsToDhms(this.task.repeat)
      this.repeatTime = repeatInterval.time;
      this.repeatDays = repeatInterval.days;
      this.name = this.task.name;
    }
  }

  getNorthData() {
    this.getCategory();
    this.getFilterPipeline();
    this.btnTxt = this.task.processName === 'north_C' ? 'Service' : 'Instance';
  }

  public toggleModal(isOpen: Boolean) {
    this.applicationTagClicked = false;
    this.validConfigurationForm = true;
    this.validFilterConfigForm = true;
    if (this.unsavedChangesInFilterForm) {
      this.showConfirmationDialog();
      return;
    }

    const activeFilterTab = <HTMLElement>document.getElementsByClassName('accordion is-active')[0];
    if (activeFilterTab !== undefined) {
      const activeContentBody = <HTMLElement>activeFilterTab.getElementsByClassName('card-content')[0];
      activeFilterTab.classList.remove('is-active');
      activeContentBody.hidden = true;
    }

    if (this.isAddFilterWizard) {
      this.getNorthData();
      this.isAddFilterWizard = false;
    }

    const modal = <HTMLDivElement>document.getElementById('north-task-modal');
    if (isOpen) {
      this.getNorthData();
      this.notify.emit(false);
      modal.classList.add('is-active');
      return;
    }
    if (this.form !== undefined) {
      this.form.reset();
    }
    this.pluginConfiguration = {};
    this.changedConfig = {};
    this.advancedConfiguration = [];
    this.apiCallsStack = [];
    this.category = null;
    this.notify.emit(false);
    modal.classList.remove('is-active');
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  filterFormStatus(status: boolean) {
    this.unsavedChangesInFilterForm = status;
  }


  public getCategory(): void {
    /** request started */
    this.ngProgress.start();
    this.enabled = this.task.enabled
    this.exclusive = this.task.exclusive
    const repeatInterval = Utils.secondsToDhms(this.task.repeat)
    this.repeatTime = repeatInterval.time;
    this.repeatDays = repeatInterval.days;
    this.name = this.task.name
    this.configService.getCategory(this.name).subscribe(
      (data: any) => {
        if (!isEmpty(data)) {
          this.category = { name: this.name, config: data };
          this.pluginConfiguration = cloneDeep({ name: this.name, config: data });
        }
        /** request completed */
        this.ngProgress.done();
      },
      error => {
        /** request completed */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText, true);
        }
      }
    );
  }

  /**
  * Open confirmation modal
  */
  showConfirmationDialog() {
    this.confirmationDialogData = {
      id: '',
      name: '',
      message: 'Do you want to discard unsaved changes?',
      key: 'unsavedConfirmation'
    };
    this.filterAlert.toggleModal(true);
  }


  public hideNotification() {
    const deleteBtn = <HTMLDivElement>document.getElementById('delete');
    deleteBtn.parentElement.classList.add('is-hidden');
    return false;
  }

  public saveScheduleFields(form: NgForm) {
    // 'touched' means the user has entered the form
    // 'dirty' / '!pristine' means the user has made a modification
    if (!form.dirty && !form.touched) {
      return false;
    }

    const updatePayload: any = {
      'enabled': form.controls['enabled'].value
    };

    if (this.task.processName !== 'north_C') {
      updatePayload.repeat = 0;
      if (form.controls['repeatTime'].value !== ('None' || undefined)) {
        updatePayload.repeat = Utils.convertTimeToSec(form.controls['repeatTime'].value, form.controls['repeatDays'].value);
      }
      updatePayload.exclusive = form.controls['exclusive'].value;
    }

    this.apiCallsStack.push(this.schedulesService.updateSchedule(this.task.id, updatePayload)
      .pipe(map(() => ({ type: 'schedule', success: true })))
      .pipe(catchError(e => of({ error: e, failed: true }))));
  }

  getTimeIntervalValue(event) {
    this.repeatTime = event.target.value;
  }

  onDelete(payload) {
    if (this.task.processName === 'north_C') {
      this.deleteService(payload);
    } else {
      this.deleteTask(payload);
    }
  }

  public deleteTask(task: NorthTask) {
    if (this.unsavedChangesInFilterForm) {
      this.filtersListComponent.discard();
    }
    this.ngProgress.start();
    this.northService.deleteTask(task.name)
      .subscribe(
        (data: any) => {
          this.ngProgress.done();
          this.reenableButton.emit(false);
          this.alertService.success(data.result, true);
          this.navToNorthPage();
          this.closeModal('delete-task-dialog');
          this.notify.emit();
        },
        (error) => {
          this.ngProgress.done();
          this.reenableButton.emit(false);
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  async deleteService(svc: any) {
    if (this.unsavedChangesInFilterForm) {
      this.filtersListComponent.discard();
    }
    this.ngProgress.start();
    await this.servicesApiService.deleteService(svc.name)
      .then(
        (data: any) => {
          this.ngProgress.done();
          this.reenableButton.emit(false);
          this.alertService.success(data.result, true);
          this.navToNorthPage();
          this.closeModal('delete-task-dialog');
          this.notify.emit();
        },
        (error) => {
          this.ngProgress.done();
          this.reenableButton.emit(false);
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  openAddFilterModal(isClicked) {
    this.applicationTagClicked = isClicked;
    this.isAddFilterWizard = isClicked;
    this.category = '';
  }

  onNotify() {
    this.getCategory();
    this.isAddFilterWizard = false;
    this.getFilterPipeline();
  }

  getFilterPipeline() {
    this.filterService.getFilterPipeline(this.task.name)
      .subscribe((data: any) => {
        this.filterPipeline = data.result.pipeline as string[];
      },
        error => {
          if (error.status === 404) {
            this.filterPipeline = [];
          } else {
            console.log('Error ', error);
          }
        });
  }


  goToLink(pluginInfo: string) {
    this.docService.goToPluginLink(pluginInfo);
  }

  navToSyslogs(task) {
    this.router.navigate(['logs/syslog'], { queryParams: { source: task.name } });
  }

  discardUnsavedChanges() {
    this.filtersListComponent.discard();
    if (this.applicationTagClicked) {
      this.isAddFilterWizard = this.applicationTagClicked;
      return;
    }
    this.navToNorthPage();
  }

  /**
  * Get edited configuration from show configuration page
  * @param changedConfiguration changed configuration of a selected plugin
  */
  getChangedConfig(changedConfiguration: any) {
    this.changedConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, this.pluginConfiguration);
  }

  /**
  * Get edited advance configuration
  * @param changedConfiguration changed configuration
  */
  getChangedAdvanceConfiguration(advanceConfig: any) {
    const configItem = this.advancedConfiguration.find(c => c.key == advanceConfig.key);
    if (configItem) {
      configItem.config = advanceConfig.config;
      if (isEmpty(configItem.config)) {
        this.advancedConfiguration = this.advancedConfiguration.filter(conf => (conf.key !== configItem.key));
      }
    } else {
      this.advancedConfiguration.push(advanceConfig)
    }
  }

  /**
  * Get scripts to upload from a configuration item
  * @param configuration  edited configuration from show configuration page
  * @returns script files to upload
  */
  getScriptFilesToUpload(configuration: any) {
    return this.fileUploaderService.getConfigurationPropertyFiles(configuration);
  }

  /**
   * update plugin configuration
   */
  updateConfiguration(categoryName: string, configuration: any, type: string) {
    const files = this.getScriptFilesToUpload(configuration);
    if (files.length > 0) {
      this.uploadScript(categoryName, files);
    }

    if (isEmpty(configuration)) {
      return;
    }

    this.apiCallsStack.push(this.configService.
      updateBulkConfiguration(categoryName, configuration)
      .pipe(map(() => ({ type, success: true })))
      .pipe(catchError(e => of({ error: e, failed: true }))));
  }

  save() {
    this.saveScheduleFields(this.form);
    if (!isEmpty(this.changedConfig) && this.pluginConfiguration?.name) {
      this.updateConfiguration(this.pluginConfiguration?.name, this.changedConfig, 'plugin-config');
    }

    if (!isEmpty(this.advancedConfiguration)) {
      this.advancedConfiguration.forEach(element => {
        this.updateConfiguration(element.key, element.config, 'plugin-config');
      });
    }

    if (this.unsavedChangesInFilterForm) {
      this.filtersListComponent.update();
      this.unsavedChangesInFilterForm = false;
      if (this.apiCallsStack.length == 0) {
        this.navToNorthPage();
      }
    }

    if (this.apiCallsStack.length > 0) {
      this.ngProgress.start();
      forkJoin(this.apiCallsStack).subscribe((result) => {
        result.forEach((r: any) => {
          this.ngProgress.done();
          this.reenableButton.emit(false);
          if (r.failed) {
            if (r.error.status === 0) {
              console.log('service down ', r.error);
            } else {
              this.toast.error(r.error.statusText);
            }
          } else {
            this.response.handleResponseMessage(r.type);
          }
        });
        this.notify.emit();
        this.navToNorthPage();
        this.form.reset();
        this.apiCallsStack = [];
      });
    }
  }

  /**
  * To upload script files of a configuration property
  * @param categoryName name of the configuration category
  * @param files : Scripts array to uplaod
  */
  public uploadScript(categoryName: string, files: any[]) {
    this.fileUploaderService.uploadConfigurationScript(categoryName, files);
    if (isEmpty(this.changedConfig) && isEmpty(this.advancedConfiguration)) {
      this.navToNorthPage();
    }
  }

  checkFormState() {
    let taskStateChanged = false;
    if (this.form) {
      const repeatInterval = this.task?.repeat ? Utils.secondsToDhms(this.task.repeat) : null;
      const taskSubset = {
        ...(this.task && { enabled: this.task?.enabled }),
        ...(this.task?.exclusive && { exclusive: this.task?.exclusive }),
        ...(repeatInterval && { repeatTime: repeatInterval?.time }),
        ...(repeatInterval && { repeatDays: repeatInterval?.days })
      }
      taskStateChanged = !isEqual(this.form.value, taskSubset);
    }
    const noChange = isEmpty(this.changedConfig) && isEmpty(this.advancedConfiguration) && !this.unsavedChangesInFilterForm && !taskStateChanged;
    return noChange;
  }

  navToNorthPage(){
    this.router.navigate(['/north']);
  }

  getNorthTasks(caching: boolean){
    this.northService.getNorthTasks(caching)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any) => {
          const tasks = data as NorthTask[];
          this.task = tasks.find(task => (task.name == this.taskName));
          // open modal window if task name is valid otherwise redirect to list page
          this.task !== undefined ? this.toggleModal(true) : this.navToNorthPage()
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }
}
