import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, QueryList, ViewChild, ViewChildren
} from '@angular/core';
import { FormBuilder, NgForm } from '@angular/forms';
import { isEmpty, omit } from 'lodash';
import { forkJoin } from 'rxjs';
import {
  AlertService, ConfigurationService, FilterService, NorthService, ProgressBarService, SchedulesService, ServicesApiService
} from '../../../../services';
import { DocService } from '../../../../services/doc.service';
import { ValidateFormService } from '../../../../services/validate-form.service';
import Utils from '../../../../utils';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';
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
  useProxy = 'true';
  useFilterProxy = 'true';

  enabled: Boolean;
  exclusive: Boolean;
  repeatTime: any;
  repeatDays: any;
  name: string;
  isWizard = false;

  public filterItemIndex;
  public isFilterOrderChanged = false;
  public filterPipeline = [];
  public deletedFilterPipeline = [];
  public filterConfiguration = [];
  public isFilterDeleted = false;
  public confirmationDialogData = {};
  public childConfiguration: any;
  public changedChildConfig = [];

  public newFilters = [];
  public isnewFilterAdded = false;
  public filesToUpload = [];

  public advanceConfigButtonText = 'Show Advanced Config';
  public isAdvanceConfig = false;
  public btnTxt = '';
  public selectedFilterPlugin;

  @ViewChild('fg', { static: false }) form: NgForm;
  regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$';

  @Input() task: any;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('taskConfigView', { static: false }) viewConfigItemComponent: ViewConfigItemComponent;
  @ViewChild(AlertDialogComponent, { static: true }) child: AlertDialogComponent;
  @ViewChildren('filterConfigView') filterConfigViewComponents: QueryList<ViewConfigItemComponent>;
  @ViewChild(FilterAlertComponent, { static: false }) filterAlert: FilterAlertComponent;
  @ViewChild(ConfigChildrenComponent, { static: false }) configChildrenComponent: ConfigChildrenComponent;

  // Object to hold data of north task to delete
  public deleteTaskData = {
    name: '',
    message: '',
    key: ''
  };
  constructor(
    private schedulesService: SchedulesService,
    private configService: ConfigurationService,
    private alertService: AlertService,
    private northService: NorthService,
    private filterService: FilterService,
    private validateFormService: ValidateFormService,
    public fb: FormBuilder,
    public ngProgress: ProgressBarService,
    private servicesApiService: ServicesApiService,
    private docService: DocService
  ) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    const alertModal = <HTMLDivElement>document.getElementById('modal-box');
    if (!alertModal.classList.contains('is-active')) {
      this.toggleModal(false);
    }
  }

  ngOnInit() { }

  ngOnChanges() {
    if (this.task !== undefined) {
      this.getCategory();
      this.checkIfAdvanceConfig(this.task['name']);
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

  closeModel() {
    if (this.isFilterOrderChanged || this.isFilterDeleted || this.isnewFilterAdded) {
      this.showConfirmationDialog();
      return;
    } else {
      this.toggleModal(false);
    }
  }

  public toggleModal(isOpen: Boolean) {
    const activeFilterTab = <HTMLElement>document.getElementsByClassName('accordion is-active')[0];
    if (activeFilterTab !== undefined) {
      const activeContentBody = <HTMLElement>activeFilterTab.getElementsByClassName('card-content')[0];
      activeFilterTab.classList.remove('is-active');
      activeContentBody.hidden = true;
    }

    if (this.isWizard) {
      this.getCategory();
      this.isWizard = false;
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
    this.isAdvanceConfig = true;
    this.getAdvanceConfig(null);
    this.filterConfiguration = [];
    modal.classList.remove('is-active');
    if (this.viewConfigItemComponent !== undefined) {
      this.viewConfigItemComponent.passwordOnChangeFired = false;
      this.viewConfigItemComponent.passwordMatched.value = true;
    }
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
    const categoryValues = [];
    this.configService.getCategory(this.name).subscribe(
      (data: any) => {
        if (!isEmpty(data)) {
          categoryValues.push(data);
          this.category = { key: this.name, value: categoryValues };
          this.useProxy = 'true';
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
      message: 'Do you want to discard unsaved changes',
      key: 'unsavedConfirmation'
    };
    this.filterAlert.toggleModal(true);
  }

  toggleAccordion(id, filterName) {
    this.useFilterProxy = 'true';
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
    if (this.isnewFilterAdded) {
      const calls = [];
      this.newFilters.forEach(f => {
        calls.push(this.filterService.saveFilter(f));
      });
      this.addFilter(calls);
    } else if (this.isFilterDeleted) {
      this.deleteFilter();
    } else if (this.isFilterOrderChanged) {
      this.updateFilterPipeline(this.filterPipeline.map(f => f.name));
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

  proxy() {
    if (!(this.validateFormService.checkViewConfigItemFormValidity(this.viewConfigItemComponent)
      && this.form.valid)) {
      return;
    }

    const filterFormStatus = this.filterConfigViewComponents.toArray().every(component => {
      return this.validateFormService.checkViewConfigItemFormValidity(component);
    });

    if (!filterFormStatus) {
      return;
    }

    if (this.useProxy) {
      document.getElementById('vci-proxy').click();
    }
    const el = <HTMLCollection>document.getElementsByClassName('vci-proxy-filter');
    for (const e of <any>el) {
      e.click();
    }
    this.updateAdvanceConfigConfiguration(this.changedChildConfig);
    document.getElementById('ss').click();
  }

  getTimeIntervalValue(event) {
    this.repeatTime = event.target.value;
  }

  /**
  * Open delete modal
  * @param message   message to show on alert
  * @param action here action is 'deleteTask'
  */
  openDeleteModal(name, message) {
    this.deleteTaskData = {
      name: name,
      message: message,
      key: this.task['processName'] === 'north_C' ? 'deleteService' : 'deleteTask'
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
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
    const catName = this.task['name'] + '_' + filterName;
    this.filterService.getFilterConfiguration(catName)
      .subscribe((data: any) => {
        this.selectedFilterPlugin = data.plugin.value;
        this.filterConfiguration.push({ key: catName, 'value': [data] });
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  setFilterConfiguration(filterName: string) {
    const catName = this.task['name'] + '_' + filterName;
    return this.filterConfiguration.find(f => f.key === catName);
  }

  openAddFilterModal(isWizard) {
    this.isWizard = isWizard;
  }

  onNotify(newFilter:any) {
    if (newFilter) {
      this.isnewFilterAdded = true;
      if ('script' in newFilter.filter_config) {
        const key = this.task.name + '_' + newFilter.name;
        this.filesToUpload.push({ key: key, script: newFilter.filter_config['script'] });
        newFilter.filter_config = omit(newFilter.filter_config, 'script')
      }
      this.newFilters.push(newFilter);
      this.filterPipeline.push({ name: newFilter.name, isFilterSaved: false })
    }

    this.isWizard = false;
    this.useProxy = 'true';
    this.isAdvanceConfig = false;
    this.advanceConfigButtonText = 'Show Advanced Config';
  }

  getFilterPipeline() {
    this.filterService.getFilterPipeline(this.task['name'])
      .subscribe((data: any) => {
        this.filterPipeline = data.result.pipeline;
        this.filterPipeline = this.filterPipeline.map(f => ({ name: f, isFilterSaved: true }))
      },
        error => {
          if (error.status === 404) {
            this.filterPipeline = [];
          } else {
            console.log('Error ', error);
          }
        });
  }

  /**
   * Method to add filter
   * @param payload  to pass in request
   */
  public addFilter(calls) {
    // to manage added filter locally
    this.ngProgress.start();
    forkJoin(calls)
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.isnewFilterAdded = false;
        this.newFilters = [];
        data.forEach(d => {
          this.alertService.success(`${d.filter} filter added successfully.`, true);
        });

        const pipeline = data.map(d => d.filter);
        this.addFilterPipeline({ 'pipeline': pipeline });
      }, error => {
        this.ngProgress.done();
        this.isnewFilterAdded = false;
        this.newFilters = [];
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  public addFilterPipeline(payload) {
    this.filterService.addFilterPipeline(payload, this.task.name).
      subscribe(() => {
        if (!isEmpty(this.filesToUpload)) {
          this.uploadScript();
        }
        // reflect delete or reorder filter changes once add filter complete
        if (this.isFilterDeleted) {
          this.deleteFilter();
        }

        if (this.isFilterOrderChanged) {
          this.updateFilterPipeline(this.filterPipeline.map(f => f.name));
        }
      },
        error => {
          this.filesToUpload = [];
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public uploadScript() {
    this.filesToUpload.forEach((fl: any) => {
      const file = fl.script[0]['script'];
      const formData = new FormData();
      formData.append('script', file);
      this.configService.uploadFile(fl.key, 'script', formData)
        .subscribe(() => {
          this.filesToUpload = [];
        },
          error => {
            this.filesToUpload = [];
            if (error.status === 0) {
              console.log('service down ', error);
            } else {
              this.alertService.error(error.statusText);
            }
          });
    });
  }

  deleteFilterReference(filter) {
    this.deletedFilterPipeline.push(filter);
    this.filterPipeline = this.filterPipeline.filter(f => f.name !== filter);
    this.isFilterDeleted = true;
    this.useProxy = 'true';
    this.isFilterOrderChanged = false;
  }

  deleteFilter() {
    this.isFilterDeleted = false;
    let pipeline = this.filterPipeline.map(f => f.name);
    pipeline = pipeline.filter(f => this.deletedFilterPipeline.find(df => df !== f));
    this.ngProgress.start();
    this.filterService.updateFilterPipeline({ 'pipeline': pipeline }, this.task['name'])
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

  checkIfAdvanceConfig(categoryName: string) {
    this.configService.getCategoryConfigChildren(categoryName).
      subscribe(
        (data: any) => {
          this.childConfiguration = data.categories.find(d => d.key.toString().includes('Advanced'));
        },
        error => {
          console.log('error ', error);
        }
      );
  }

  getAdvanceConfig(childConfig) {
    if (!this.isAdvanceConfig) {
      this.isAdvanceConfig = true;
      this.advanceConfigButtonText = 'Hide Advanced Config';
      this.configChildrenComponent.getAdvanceConfig(childConfig, this.isAdvanceConfig);
    } else {
      this.isAdvanceConfig = false;
      this.advanceConfigButtonText = 'Show Advanced Config';
    }
  }

  /**
  * Get edited configuration from child config page
  * @param changedConfig changed configuration of a selected plugin
  */
  getChangedConfig(changedConfig) {
    if (isEmpty(changedConfig)) {
      return;
    }
    changedConfig = changedConfig.map(el => {
      if (el.type.toUpperCase() === 'JSON') {
        el.value = JSON.parse(el.value);
      }
      return {
        [el.key]: el.value !== undefined ? el.value : el.default,
      };
    });

    changedConfig = Object.assign({}, ...changedConfig); // merge all object into one
    this.changedChildConfig = changedConfig;
  }

  public updateAdvanceConfigConfiguration(configItems: any) {
    if (isEmpty(configItems)) {
      return;
    }
    /** request started */
    this.ngProgress.start();
    this.configService.updateBulkConfiguration(this.childConfiguration.key, configItems).
      subscribe(
        () => {
          this.changedChildConfig = [];  // clear the array
          /** request completed */
          this.ngProgress.done();
          this.alertService.success('Configuration updated successfully.');
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

  goToLink(pluginInfo) {
    this.docService.goToPluginLink(pluginInfo);
  }

  discardChanges() {
    this.isFilterOrderChanged = false;
    this.isFilterDeleted = false;
    this.deletedFilterPipeline = [];
    this.toggleModal(false);
  }
}
