import {
  Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, QueryList, ViewChild, ViewChildren
} from '@angular/core';
import { FormBuilder, NgForm } from '@angular/forms';

import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { assign, cloneDeep, reduce, isEmpty, map } from 'lodash';

import { Router } from '@angular/router';
import {
  AlertService, ConfigurationService, FileUploaderService, FilterService, NorthService, ProgressBarService, RolesService, SchedulesService, ServicesApiService
} from '../../../../services';
import { DocService } from '../../../../services/doc.service';
import Utils from '../../../../utils';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { ConfigChildrenComponent } from '../../configuration-manager/config-children/config-children.component';
import {
  ViewConfigItemComponent
} from '../../configuration-manager/view-config-item/view-config-item.component';
import { FilterAlertComponent } from '../../filter/filter-alert/filter-alert.component';

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
  public filterConfiguration;
  public isFilterDeleted = false;
  public confirmationDialogData = {};
  public btnTxt = '';
  public selectedFilterPlugin;

  @ViewChild('fg') form: NgForm;
  regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$';

  @Input() task: any;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChildren('filterConfigView') filterConfigViewComponents: QueryList<ViewConfigItemComponent>;
  @ViewChild(FilterAlertComponent) filterAlert: FilterAlertComponent;
  @ViewChild('configChildComponent') configChildComponent: ConfigChildrenComponent;

  // to hold child form state
  validConfigurationForm = true;
  validFilterConfigForm = true;
  private filesToUpload = [];
  pluginConfiguration;
  changedConfig = {};

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
    private fileUploaderService: FileUploaderService
  ) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    const alertModal = <HTMLDivElement>document.getElementById('modal-box');
    if (!alertModal.classList.contains('is-active')) {
      this.toggleModal(false);
    }
  }

  ngOnInit() { }

  ngOnChanges() {
    this.getNorthData();
  }

  refreshPageData() {
    this.getNorthData();
    if (this.configChildComponent) {
      this.configChildComponent.getChildConfigData();
    }
  }

  getNorthData() {
    if (this.task !== undefined) {
      this.getCategory();
      this.getFilterPipeline();
      this.btnTxt = this.task['processName'] === 'north_C' ? 'Service' : 'Instance';
    }
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
    this.notify.emit(true);
    if (this.form !== undefined) {
      this.form.reset();
    }
    this.category = null;
    this.filterConfiguration = [];
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
          this.category = { key: this.name, config: data };
          this.pluginConfiguration = cloneDeep({ key: this.name, config: data });
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
      this.toggleModal(false);
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

    /** request started */
    this.ngProgress.start();
    this.schedulesService.updateSchedule(this.task['id'], updatePayload).
      subscribe(
        () => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success('Schedule updated successfully.');
          this.notify.emit();
          this.toggleModal(false);
          form.reset();
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
   * Get edited configuration from view config child page
   * @param changedConfig changed configuration of a selected plugin
   */
  getChangedConfig(changedConfig: any) {
    console.log('config', changedConfig);

    const defaultConfig = map(this.pluginConfiguration.config, (v, key) => ({ key, ...v }));
    // make a copy of matched config items having changed values
    const matchedConfig = defaultConfig.filter(e1 => {
      return changedConfig.hasOwnProperty(e1.key) && e1.value !== changedConfig[e1.key]
    });
    // make a deep clone copy of matchedConfig array to remove extra keys(not required in payload)
    const matchedConfigCopy = cloneDeep(matchedConfig);

    /**
     * merge new configuration with old configuration,
     * where value key hold changed data in config object
    */
    matchedConfigCopy.forEach(e => e.value = changedConfig[e.key]);
    // final array to hold changed configuration
    let finalConfig = [];
    this.filesToUpload = [];
    matchedConfigCopy.forEach(item => {
      if (item.type === 'script') {
        this.filesToUpload.push(...item.value);
      } else {
        finalConfig.push({
          [item.key]: item.type === 'JSON' ? JSON.parse(item.value) : item.value
        });
      }
    });

    // convert finalConfig array in object of objects to pass in add task
    this.changedConfig = reduce(finalConfig, function (memo, current) { return assign(memo, current); }, {});
  }

  /**
   * update plugin configuration
   */
  updateConfiguration() {
    console.log('changed config', this.changedConfig);
    if (isEmpty(this.changedConfig)) {
      return;
    }
    /** request started */
    this.ngProgress.start();
    this.configService.updateBulkConfiguration(this.pluginConfiguration.key, this.changedConfig).
      subscribe(
        (data: any) => {
          console.log('data', data);
          this.changedConfig = {};
          /** request completed */
          this.ngProgress.done();
          this.alertService.success('Configuration updated successfully.', true);
          if (this.filesToUpload.length > 0) {
            this.uploadScript();
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

  public uploadScript() {
    this.fileUploaderService.uploadConfigurationScript(this.pluginConfiguration.key, this.filesToUpload);
  }
}
