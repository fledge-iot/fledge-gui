import {
  Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Parser } from 'json2csv';
import { isEmpty } from 'lodash';
import { NgProgress } from 'ngx-progressbar';
import { DndDropEvent } from 'ngx-drag-drop';

import {
  AlertService,
  AssetsService,
  ConfigurationService,
  FilterService,
  SchedulesService,
  ServicesHealthService,
} from '../../../../services';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';
import { ConfigChildrenComponent } from '../../configuration-manager/config-children/config-children.component';
import { ViewConfigItemComponent } from '../../configuration-manager/view-config-item/view-config-item.component';
import { FilterAlertComponent } from '../../filter/filter-alert/filter-alert.component';

@Component({
  selector: 'app-south-service-modal',
  templateUrl: './south-service-modal.component.html',
  styleUrls: ['./south-service-modal.component.css']
})
export class SouthServiceModalComponent implements OnInit, OnChanges {

  public category: any;
  public useProxy: 'true';
  public useFilterProxy: 'true';
  public isEnabled = false;
  public isAdvanceConfig = false;
  public advanceConfigButtonText = 'Show Advanced Config';
  svcCheckbox: FormControl = new FormControl();
  public childConfiguration;
  public changedChildConfig = [];
  public filterPipeline = [];
  public deletedFilterPipeline = [];
  public filterConfiguration;

  public isFilterOrderChanged = false;
  public isFilterDeleted = false;

  public filterItemIndex;


  public isWizard;
  // Object to hold data of south service to delete
  public serviceRecord;

  confirmationDialogData = {};

  @Input() service: { service: any };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('serviceConfigView') viewConfigItemComponent: ViewConfigItemComponent;
  @ViewChild('filterConfigView') filterConfigViewComponent: ViewConfigItemComponent;
  @ViewChild(ConfigChildrenComponent) configChildrenComponent: ConfigChildrenComponent;
  @ViewChild(AlertDialogComponent) child: AlertDialogComponent;
  @ViewChild(FilterAlertComponent) filterAlert: FilterAlertComponent;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    private assetService: AssetsService,
    private filterService: FilterService,
    public ngProgress: NgProgress,
    private servicesHealthService: ServicesHealthService,
    private schedulesService: SchedulesService) { }

  ngOnInit() {
    this.svcCheckbox.valueChanges.subscribe(val => {
      this.isEnabled = val;
    });
  }

  ngOnChanges() {
    if (this.service !== undefined) {
      this.getCategory();
      this.checkIfAdvanceConfig(this.service['name']);
      this.getFilterPipeline();
    }
  }

  onDragStart(itemIndex) {
    this.filterItemIndex = itemIndex;
  }

  onDrop(event: DndDropEvent, list?: any[]) {
    const oldIndex = this.filterItemIndex;
    if (list
      && (event.dropEffect === 'copy'
        || event.dropEffect === 'move')) {

      let newIndex = event.index;

      if (typeof newIndex === 'undefined') {
        newIndex = list.length;
      }
      list.splice(newIndex, 0, list.splice(oldIndex, 1)[0]);
    }
    this.isFilterOrderChanged = true;
  }

  public toggleModal(isOpen: Boolean) {
    if (this.isFilterOrderChanged || this.isFilterDeleted) {
      this.showConfirmationDialog();
      return;
    }
    const activeFilterTab = <HTMLElement>document.getElementsByClassName('accordion is-active')[0];
    if (activeFilterTab !== undefined) {
      activeFilterTab.classList.remove('is-active');
    }

    const modalWindow = <HTMLDivElement>document.getElementById('south-service-modal');

    if (this.isWizard) {
      this.getCategory();
      this.isWizard = false;
    }
    if (isOpen) {
      this.svcCheckbox.setValue(this.service['schedule_enabled']);
      modalWindow.classList.add('is-active');
      return;
    }
    this.isAdvanceConfig = true;
    this.getAdvanceConfig(null);
    modalWindow.classList.remove('is-active');
  }

  public getCategory(): void {
    /** request started */
    this.ngProgress.start();
    const categoryValues = [];
    this.configService.getCategory(this.service['name']).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            categoryValues.push(data);
            this.category = { key: this.service['name'], value: categoryValues };
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

  public showNotification() {
    const notificationMsg = <HTMLDivElement>document.getElementById('message');
    notificationMsg.classList.remove('is-hidden');
    return false;
  }

  public hideNotification() {
    const deleteBtn = <HTMLDivElement>document.getElementById('delete');
    deleteBtn.parentElement.classList.add('is-hidden');
    return false;
  }

  public disableSchedule(serviceName) {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.disableScheduleByName(serviceName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.notify.emit();
          this.alertService.success(data['message'], true);
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

  public enableSchedule(serviceName) {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.enableScheduleByName(serviceName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.notify.emit();
          this.alertService.success(data['message'], true);
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

  saveChanges(serviceName) {
    if (this.isFilterDeleted) {
      this.deleteFilter();
    }
    if (this.isFilterOrderChanged) {
      this.updateFilterPipeline(this.filterPipeline);
    }
    this.changeServiceStatus(serviceName);
    this.toggleModal(false);
  }

  changeServiceStatus(serviceName) {
    if (!this.svcCheckbox.dirty && !this.svcCheckbox.touched) {
      return false;
    }
    if (this.isEnabled) {
      this.enableSchedule(serviceName);
      this.svcCheckbox.reset(true);
    } else if (!this.isEnabled) {
      this.disableSchedule(serviceName);
      this.svcCheckbox.reset(false);
    }
  }

  checkIfAdvanceConfig(categoryName) {
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

  proxy() {
    if (this.useProxy) {
      document.getElementById('vci-proxy').click();
    }
    const el = <HTMLCollection>document.getElementsByClassName('vci-proxy-filter');
    for (const e of <any>el) {
      e.click();
    }
    if (this.filterConfigViewComponent !== undefined && !this.filterConfigViewComponent.isValidForm) {
      return;
    }
    if (this.viewConfigItemComponent !== undefined && !this.viewConfigItemComponent.isValidForm) {
      return;
    }
    this.updateConfigConfiguration(this.changedChildConfig);
    document.getElementById('ss').click();
  }

  public updateConfigConfiguration(configItems) {
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

  /**
   * Open delete modal
   * @param message   message to show on alert
   * @param action here action is 'deleteService'
   */
  openDeleteModal(port, protocol, name, message, action) {
    this.serviceRecord = {
      port: port,
      protocol: protocol,
      name: name,
      message: message,
      key: action
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }


  /**
  * Open confirmation modal
  * @param message   message to show on alert
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

  getAssetReadings(service) {
    console.log('download start time', performance.now());
    const fields = ['assetName', 'reading', 'timestamp'];
    const opts = { fields };
    const assets = service.assets;
    let assetReadings = [];
    assets.forEach((ast, i) => {
      this.assetService.getAssetReadings(encodeURIComponent(ast.asset), ast.count).
        subscribe(
          (result: any[]) => {
            result = result.map(r => {
              r['assetName'] = ast.asset;
              return r;
            });
            assetReadings = assetReadings.concat(result);
            if (i === assets.length - 1) {
              const parser = new Parser(opts);
              const csv = parser.parse(assetReadings);
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              // create a custom anchor tag
              const a = document.createElement('a');
              a.href = url;
              a.download = service['name'] + '-readings.csv';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              console.log('download end time', performance.now());
            }
          },
          error => {
            console.log('error in response', error);
          });
    });
  }

  deleteService(svc) {
    this.ngProgress.start();
    this.servicesHealthService.deleteService(svc.name)
      .subscribe(
        (data) => {
          this.ngProgress.done();
          this.alertService.success(data['result'], true);
          this.toggleModal(false);
          setTimeout(() => {
            this.notify.emit();
          }, 6000);
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

  openAddFilterModal(isWizard) {
    this.isWizard = isWizard;
    this.category = '';
  }

  onNotify() {
    this.getCategory();
    this.isWizard = false;
    this.getFilterPipeline();
  }

  getFilterPipeline() {
    this.filterService.getFilterPipeline(this.service['name'])
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

  activeAccordion(id, filterName) {
    this.useFilterProxy = 'true';
    const last = <HTMLElement>document.getElementsByClassName('accordion is-active')[0];
    if (last !== undefined) {
      const body = <HTMLElement>last.getElementsByClassName('accordion-content')[0];
      const activeId = last.getAttribute('id');
      if (id !== +activeId) {
        body.hidden = true;
        last.classList.remove('is-active');
        const next = <HTMLElement>document.getElementById(id);
        next.setAttribute('class', 'is-light accordion is-active');
        this.getFilterConfiguration(filterName);
      } else {
        last.classList.remove('is-active');
        body.hidden = true;
      }
    } else {
      const element = <HTMLElement>document.getElementById(id);
      const body = <HTMLElement>element.getElementsByClassName('accordion-content')[0];
      body.hidden = false;
      element.setAttribute('class', 'is-light accordion is-active');
      this.getFilterConfiguration(filterName);
    }
  }

  getFilterConfiguration(filterName) {
    this.filterConfiguration = [];
    const catName = this.service['name'] + '_' + filterName;
    this.filterService.getFilterConfiguration(catName)
      .subscribe((data: any) => {
        this.filterConfiguration = { key: catName, 'value': [data] };
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
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
    this.filterService.updateFilterPipeline({ 'pipeline': this.filterPipeline }, this.service['name'])
      .subscribe(() => {
        this.deletedFilterPipeline.forEach(filter => {
          this.filterService.deleteFilter(filter).subscribe((data: any) => {
            this.ngProgress.done();
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

  public updateFilterPipeline(filterPipeline) {
    this.isFilterOrderChanged = false;
    this.ngProgress.start();
    this.filterService.updateFilterPipeline({ 'pipeline': filterPipeline }, this.service['name'])
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

  discardChanges(event) {
    if (event) {
      this.isFilterOrderChanged = false;
      this.isFilterDeleted = false;
      this.deletedFilterPipeline = [];
      this.toggleModal(false);
    }
  }
}


