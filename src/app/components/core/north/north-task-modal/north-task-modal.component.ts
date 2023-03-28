import {
  Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild
} from '@angular/core';
import { FormBuilder, NgForm } from '@angular/forms';

import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { cloneDeep, isEmpty } from 'lodash';

import { Router } from '@angular/router';
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
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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

  public filterItemIndex;
  public isFilterOrderChanged = false;
  public filterPipeline = [];
  public deletedFilterPipeline = [];
  public filterConfiguration: any;
  public isFilterDeleted = false;
  public confirmationDialogData = {};
  public btnTxt = '';
  public selectedFilterPlugin;

  @ViewChild('fg') form: NgForm;
  regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$';

  @Input() task: any;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('pluginConfigComponent') pluginConfigComponent: ConfigurationGroupComponent;
  @ViewChild('filterConfigComponent') filterConfigComponent: ConfigurationGroupComponent;
  @ViewChild(FilterAlertComponent) filterAlert: FilterAlertComponent;

  // to hold child form state
  validConfigurationForm = true;
  validFilterConfigForm = true;
  pluginConfiguration;
  changedConfig = {};

  filterConfigurationCopy: any;
  changedFilterConfig: any;
  advancedConfiguration = [];

  // To hold API calls to execute
  apiCallsStack = [];

  constructor(
    private router: Router,
    private schedulesService: SchedulesService,
    private configService: ConfigurationService,
    private alertService: AlertService,
    private northService: NorthService,
    private filterService: FilterService,
    public fb: FormBuilder,
    private dialogService: DialogService,
    public ngProgress: ProgressBarService,
    private servicesApiService: ServicesApiService,
    private docService: DocService,
    public rolesService: RolesService,
    private configurationControlService: ConfigurationControlService,
    private fileUploaderService: FileUploaderService,
    private response: ResponseHandler,
    private toast: ToastService
  ) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    const alertModal = <HTMLDivElement>document.getElementById('modal-box');
    if (!alertModal.classList.contains('is-active')) {
      this.toggleModal(false);
    }
  }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes?.task?.previousValue !== changes?.task?.currentValue) {
      this.getNorthData();
    }
  }

  refreshPageData() {
    if (this.pluginConfiguration) {
      const pluginConfigCopy = cloneDeep(this.pluginConfiguration);
      this.pluginConfigComponent?.updateCategroyConfig(pluginConfigCopy.config);
    }
    if (this.filterConfigurationCopy) {
      const filterConfig = cloneDeep(this.filterConfigurationCopy.config);
      this.filterConfigComponent?.updateCategroyConfig(filterConfig);
    }

    if (this.form !== undefined) {
      this.enabled = this.task['enabled'];
      this.exclusive = this.task['exclusive'];
      const repeatInterval = Utils.secondsToDhms(this.task['repeat']);
      this.repeatTime = repeatInterval.time;
      this.repeatDays = repeatInterval.days;
      this.name = this.task['name'];
    }
  }

  getNorthData() {
    this.getCategory();
    this.getFilterPipeline();
    this.btnTxt = this.task['processName'] === 'north_C' ? 'Service' : 'Instance';
  }

  onDrop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    moveItemInArray(this.filterPipeline, event.previousIndex, event.currentIndex);
    this.isFilterOrderChanged = true;
  }

  public updateFilterPipeline(filterPipeline) {
    this.isFilterOrderChanged = false;
    this.ngProgress.start();
    this.filterService.updateFilterPipeline({ 'pipeline': filterPipeline }, this.task['name'])
      .subscribe(() => {
        this.ngProgress.done();
        this.alertService.success('Filter pipeline updated successfully.', true);
      },
        (error) => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public toggleModal(isOpen: Boolean) {
    this.applicationTagClicked = false;
    this.validConfigurationForm = true;
    this.validFilterConfigForm = true;
    if (this.isFilterOrderChanged || this.isFilterDeleted) {
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
      this.getCategory();
      this.isAddFilterWizard = false;
    }

    const modal = <HTMLDivElement>document.getElementById('north-task-modal');
    if (isOpen) {
      this.notify.emit(false);
      modal.classList.add('is-active');
      return;
    }
    if (this.form !== undefined) {
      this.form.reset();
    }
    this.pluginConfiguration = {};
    this.filterConfiguration = {};
    this.changedConfig = {};
    this.changedFilterConfig = {};
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


  public getCategory(): void {
    /** request started */
    this.ngProgress.start();
    this.enabled = this.task['enabled'];
    this.exclusive = this.task['exclusive'];
    const repeatInterval = Utils.secondsToDhms(this.task['repeat']);
    this.repeatTime = repeatInterval.time;
    this.repeatDays = repeatInterval.days;
    this.name = this.task['name'];
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

  toggleAccordion(id, filterName) {
    const last = <HTMLElement>document.getElementsByClassName('accordion card is-active')[0];
    if (last !== undefined) {
      const lastActiveContentBody = <HTMLElement>last.getElementsByClassName('card-content')[0];
      const activeId = last.getAttribute('id');
      lastActiveContentBody.hidden = true;
      last.classList.remove('is-active');
      if (id !== +activeId) {
        const next = <HTMLElement>document.getElementById(id);
        const nextActiveContentBody = <HTMLElement>next.getElementsByClassName('card-content')[0];
        nextActiveContentBody.hidden = false;
        next.setAttribute('class', 'accordion card is-active');
        this.getFilterConfiguration(filterName);
      } else {
        last.classList.remove('is-active');
        lastActiveContentBody.hidden = true;
      }
    } else {
      const element = <HTMLElement>document.getElementById(id);
      const body = <HTMLElement>element.getElementsByClassName('card-content')[0];
      body.hidden = false;
      element.setAttribute('class', 'accordion card is-active');
      this.getFilterConfiguration(filterName);
    }
  }

  public hideNotification() {
    const deleteBtn = <HTMLDivElement>document.getElementById('delete');
    deleteBtn.parentElement.classList.add('is-hidden');
    return false;
  }

  public saveScheduleFields(form: NgForm) {
    if (this.isFilterDeleted) {
      this.deleteFilter();
    }
    if (this.isFilterOrderChanged) {
      this.updateFilterPipeline(this.filterPipeline);
    }

    // 'touched' means the user has entered the form
    // 'dirty' / '!pristine' means the user has made a modification
    if (!form.dirty && !form.touched) {
      return false;
    }

    const updatePayload: any = {
      'enabled': form.controls['enabled'].value
    };

    if (this.task['processName'] !== 'north_C') {
      updatePayload.repeat = 0;
      if (form.controls['repeatTime'].value !== ('None' || undefined)) {
        updatePayload.repeat = Utils.convertTimeToSec(form.controls['repeatTime'].value, form.controls['repeatDays'].value);
      }
      updatePayload.exclusive = form.controls['exclusive'].value;
    }

    this.apiCallsStack.push(this.schedulesService.updateSchedule(this.task['id'], updatePayload)
      .pipe(map(() => ({ type: 'schedule', success: true })))
      .pipe(catchError(e => of({ error: e, failed: true }))));
  }

  getTimeIntervalValue(event) {
    this.repeatTime = event.target.value;
  }

  onDelete(payload) {
    if (this.task['processName'] === 'north_C') {
      this.deleteService(payload);
    } else {
      this.deleteTask(payload);
    }
  }

  public deleteTask(task: any) {
    // check if user deleting instance without saving previous changes in filters
    if (this.isFilterOrderChanged || this.isFilterDeleted) {
      this.isFilterOrderChanged = false;
      this.isFilterDeleted = false;
    }
    this.ngProgress.start();
    this.northService.deleteTask(task.name)
      .subscribe(
        (data) => {
          this.ngProgress.done();
          this.alertService.success(data['result'], true);
          this.toggleModal(false);
          this.closeModal('delete-task-dialog');
          this.notify.emit();
        },
        (error) => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  deleteService(svc: any) {
    // check if user deleting service without saving previous changes in filters
    if (this.isFilterOrderChanged || this.isFilterDeleted) {
      this.isFilterOrderChanged = false;
      this.isFilterDeleted = false;
    }
    this.ngProgress.start();
    this.servicesApiService.deleteService(svc.name)
      .subscribe(
        (data) => {
          this.ngProgress.done();
          this.alertService.success(data['result'], true);
          this.toggleModal(false);
          this.closeModal('delete-task-dialog');
          this.notify.emit();
        },
        (error) => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  getFilterConfiguration(filterName) {
    const catName = `${this.task['name']}_${filterName}`;
    this.filterService.getFilterConfiguration(catName)
      .subscribe((data: any) => {
        this.selectedFilterPlugin = data.plugin.value;
        this.filterConfiguration = { key: catName, config: data };
        this.filterConfigurationCopy = cloneDeep({ key: catName, config: data });
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  openAddFilterModal(isClicked) {
    this.applicationTagClicked = isClicked;
    if (this.isFilterOrderChanged || this.isFilterDeleted) {
      this.showConfirmationDialog();
      return;
    }
    this.isAddFilterWizard = isClicked;
    this.category = '';
    this.isFilterOrderChanged = false;
    this.isFilterDeleted = false;
    this.deletedFilterPipeline = [];
  }

  onNotify() {
    this.getCategory();
    this.isAddFilterWizard = false;
    this.getFilterPipeline();
  }

  getFilterPipeline() {
    this.filterService.getFilterPipeline(this.task['name'])
      .subscribe((data: any) => {
        this.filterPipeline = data.result.pipeline;
      },
        error => {
          if (error.status === 404) {
            this.filterPipeline = [];
          } else {
            console.log('Error ', error);
          }
        });
  }

  deleteFilterReference(filter) {
    this.deletedFilterPipeline.push(filter);
    this.filterPipeline = this.filterPipeline.filter(f => f !== filter);
    this.isFilterDeleted = true;
    this.isFilterOrderChanged = false;
  }

  deleteFilter() {
    this.isFilterDeleted = false;
    this.ngProgress.start();
    this.filterService.updateFilterPipeline({ 'pipeline': this.filterPipeline }, this.task['name'])
      .subscribe(() => {
        this.deletedFilterPipeline.forEach((filter, index) => {
          this.filterService.deleteFilter(filter).subscribe((data: any) => {
            this.ngProgress.done();
            if (this.deletedFilterPipeline.length === index + 1) {
              this.deletedFilterPipeline = []; // clear deleted filter reference
            }
            this.alertService.success(data.result, true);
          },
            (error) => {
              this.ngProgress.done();
              if (error.status === 0) {
                console.log('service down ', error);
              } else {
                this.alertService.error(error.statusText);
              }
            });
        });
      },
        (error) => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  goToLink(pluginInfo) {
    this.docService.goToPluginLink(pluginInfo);
  }

  navToSyslogs(task) {
    this.router.navigate(['logs/syslog'], { queryParams: { source: task.name } });
  }

  discardChanges() {
    this.isFilterOrderChanged = false;
    this.isFilterDeleted = false;
    this.deletedFilterPipeline = [];
    if (this.applicationTagClicked) {
      this.isAddFilterWizard = this.applicationTagClicked;
      return;
    }
    this.toggleModal(false);
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
   * Get edited filter configuration from show configuration page
   * @param changedConfiguration changed configuration of a selected filter
   */
  getChangedFilterConfig(changedConfiguration: any) {
    this.changedFilterConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, this.filterConfigurationCopy);
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
    let isFilterPipeLineChanged = this.isFilterDeleted || this.isFilterOrderChanged;
    this.saveScheduleFields(this.form);
    if (!isEmpty(this.changedConfig) && this.pluginConfiguration?.name) {
      this.updateConfiguration(this.pluginConfiguration?.name, this.changedConfig, 'plugin-config');
    }
    if (!isEmpty(this.changedFilterConfig) && this.filterConfigurationCopy?.key) {
      this.updateConfiguration(this.filterConfigurationCopy?.key, this.changedFilterConfig, 'filter-config');
    }

    if (!isEmpty(this.advancedConfiguration)) {
      this.advancedConfiguration.forEach(element => {
        this.updateConfiguration(element.key, element.config, 'plugin-config');
      });
    }

    if (this.apiCallsStack.length > 0) {
      this.ngProgress.start();
      forkJoin(this.apiCallsStack).subscribe((result) => {
        result.forEach((r: any) => {
          this.ngProgress.done();
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
        this.toggleModal(false);
        this.form.reset();
        this.apiCallsStack = [];
      });
    } else {
      if(!isFilterPipeLineChanged){
        this.toast.info('Nothing to save', 3000);
      }
      this.toggleModal(false);
    }
  }

  /**
  * To upload script files of a configuration property
  * @param categoryName name of the configuration category
  * @param files : Scripts array to uplaod
  */
  public uploadScript(categoryName: string, files: any[]) {
    this.fileUploaderService.uploadConfigurationScript(categoryName, files);
    if (isEmpty(this.changedConfig) && isEmpty(this.advancedConfiguration)
      && isEmpty(this.changedFilterConfig)) {
      this.toggleModal(false);
    }
  }
}
