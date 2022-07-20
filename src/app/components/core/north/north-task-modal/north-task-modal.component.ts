import {
  Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, QueryList, ViewChild, ViewChildren
} from '@angular/core';
import { FormBuilder, NgForm } from '@angular/forms';

import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { isEmpty } from 'lodash';

import { Router } from '@angular/router';
import {
  AlertService, ConfigurationService, FilterService, NorthService, ProgressBarService, SchedulesService, ServicesApiService
} from '../../../../services';
import { DocService } from '../../../../services/doc.service';
import { ValidateFormService } from '../../../../services/validate-form.service';
import Utils from '../../../../utils';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';
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
  useProxy: 'true';
  useFilterProxy: 'true';

  enabled: Boolean;
  exclusive: Boolean;
  repeatTime: any;
  repeatDays: any;
  name: string;
  isWizard = false;
  public applicationTagClicked = false;

  public filterItemIndex;
  public isFilterOrderChanged = false;
  public filterPipeline = [];
  public deletedFilterPipeline = [];
  public filterConfiguration = [];
  public isFilterDeleted = false;
  public confirmationDialogData = {};
  public btnTxt = '';
  public selectedFilterPlugin;

  @ViewChild('fg') form: NgForm;
  regExp = '^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$';

  @Input() task: { task: any };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild(AlertDialogComponent, { static: true }) child: AlertDialogComponent;
  @ViewChildren('filterConfigView') filterConfigViewComponents: QueryList<ViewConfigItemComponent>;
  @ViewChild(FilterAlertComponent) filterAlert: FilterAlertComponent;

  // Object to hold data of north task to delete
  public deleteTaskData = {
    name: '',
    message: '',
    key: ''
  };
  constructor(
    private router: Router,
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
    this.getNorthData();
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
    this.category = null;
    this.filterConfiguration = [];
    modal.classList.remove('is-active');
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

  proxy() {
    if (!this.form.valid) {
      return;
    }

    const filterFormStatus = this.filterConfigViewComponents.toArray().every(component => {
      return this.validateFormService.checkViewConfigItemFormValidity(component);
    });

    if (!filterFormStatus) {
      return;
    }

    if (this.useProxy === 'true') {
      document.getElementById('vci-proxy').click();
    }

    const el = <HTMLCollection>document.getElementsByClassName('vci-proxy-filter');
    for (const e of <any>el) {
      e.click();
    }

    const securityCel = <HTMLCollection>document.getElementsByClassName('vci-proxy-children');
    for (const e of <any>securityCel) {
      e.click();
    }

    // this.updateAdvanceConfigConfiguration(this.changedChildConfig);
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

  openAddFilterModal(isClicked) {
    this.applicationTagClicked = isClicked;
    if (this.isFilterOrderChanged || this.isFilterDeleted) {
      this.showConfirmationDialog();
      return;
    }
    this.isWizard = isClicked;
    this.category = '';
    this.isFilterOrderChanged = false;
    this.isFilterDeleted = false;
    this.deletedFilterPipeline = [];
  }

  onNotify() {
    this.getCategory();
    this.isWizard = false;
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
    this.router.navigate(['syslog'], { queryParams: { source: task.name } });
  }

  discardChanges() {
    this.isFilterOrderChanged = false;
    this.isFilterDeleted = false;
    this.deletedFilterPipeline = [];
    if (this.applicationTagClicked) {
      this.isWizard = this.applicationTagClicked;
      return;
    }
    this.toggleModal(false);
  }
}
