import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, QueryList, ViewChild, ViewChildren
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { isEmpty, omit } from 'lodash';
import { forkJoin } from 'rxjs';
import {
  AlertService, AssetsService, ConfigurationService, FilterService, GenerateCsvService, ProgressBarService, SchedulesService,
  ServicesApiService
} from '../../../../services';
import { DocService } from '../../../../services/doc.service';
import { ValidateFormService } from '../../../../services/validate-form.service';
import { MAX_INT_SIZE } from '../../../../utils';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';
import {
  ConfigChildrenComponent
} from '../../configuration-manager/config-children/config-children.component';
import {
  ViewConfigItemComponent
} from '../../configuration-manager/view-config-item/view-config-item.component';
import { FilterAlertComponent } from '../../filter/filter-alert/filter-alert.component';


@Component({
  selector: 'app-south-service-modal',
  templateUrl: './south-service-modal.component.html',
  styleUrls: ['./south-service-modal.component.css']
})
export class SouthServiceModalComponent implements OnInit, OnChanges {

  public category: any;
  public useProxy = 'true';
  public useFilterProxy = 'true';
  public isEnabled = false;
  public isAdvanceConfig = false;
  public advanceConfigButtonText = 'Show Advanced Config';
  svcCheckbox: FormControl = new FormControl();
  public childConfiguration;
  public changedChildConfig = [];
  public filterPipeline = [];
  public deletedFilterPipeline = [];
  public filterConfiguration = [];

  public newFilters = [];
  public isnewFilterAdded = false;
  public filesToUpload = [];

  public isFilterOrderChanged = false;
  public isFilterDeleted = false;

  assetReadings = [];
  public filterItemIndex;
  public isWizard;

  // Object to hold data of south service to delete
  public serviceRecord;
  public selectedFilterPlugin;

  confirmationDialogData = {};
  MAX_RANGE = MAX_INT_SIZE / 2;

  @Input() service: any;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('serviceConfigView', { static: false }) viewConfigItemComponent: ViewConfigItemComponent;
  @ViewChildren('filterConfigView') filterConfigViewComponents: QueryList<ViewConfigItemComponent>;
  @ViewChild(ConfigChildrenComponent, { static: false }) configChildrenComponent: ConfigChildrenComponent;
  @ViewChild(AlertDialogComponent, { static: true }) child: AlertDialogComponent;
  @ViewChild(FilterAlertComponent, { static: false }) filterAlert: FilterAlertComponent;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    private assetService: AssetsService,
    private filterService: FilterService,
    public ngProgress: ProgressBarService,
    public generateCsv: GenerateCsvService,
    private servicesApiService: ServicesApiService,
    private validateFormService: ValidateFormService,
    private schedulesService: SchedulesService,
    private docService: DocService) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    const alertModal = <HTMLDivElement>document.getElementById('modal-box');
    if (!alertModal.classList.contains('is-active')) {
      this.toggleModal(false);
    }
  }

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

  onDrop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    moveItemInArray(this.filterPipeline, event.previousIndex, event.currentIndex);
    this.isFilterOrderChanged = true;
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

    const modalWindow = <HTMLDivElement>document.getElementById('south-service-modal');
    if (isOpen) {
      this.notify.emit(false);
      this.svcCheckbox.setValue(this.service['schedule_enabled']);
      modalWindow.classList.add('is-active');
      return;
    }
    this.notify.emit(false);
    this.isAdvanceConfig = true;
    this.getAdvanceConfig(null);
    this.filterConfiguration = [];
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
    if (!this.validateFormService.checkViewConfigItemFormValidity(this.viewConfigItemComponent)) {
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

    if (!this.isnewFilterAdded) {
      const el = <HTMLCollection>document.getElementsByClassName('vci-proxy-filter');
      for (const e of <any>el) {
        e.click();
      }
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
          this.alertService.success('Configuration updated successfully.', true);
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

  getAssetReadings(service: any) {
    this.assetReadings = [];
    const fileName = service['name'] + '-readings';
    const assets = service.assets;
    const assetRecord: any = [];
    if (assets.length === 0) {
      this.alertService.error('No readings to export.', true);
      return;
    }
    this.alertService.activityMessage('Exporting readings to ' + fileName, true);
    assets.forEach((ast: any) => {
      let limit = ast.count;
      let offset = 0;
      if (ast.count > this.MAX_RANGE) {
        limit = this.MAX_RANGE;
        const chunkCount = Math.ceil(ast.count / this.MAX_RANGE);
        let lastChunkLimit = (ast.count % this.MAX_RANGE);
        if (lastChunkLimit === 0) {
          lastChunkLimit = this.MAX_RANGE;
        }
        for (let j = 0; j < chunkCount; j++) {
          if (j !== 0) {
            offset = (this.MAX_RANGE * j);
          }
          if (j === (chunkCount - 1)) {
            limit = lastChunkLimit;
          }
          assetRecord.push({ asset: ast.asset, limit: limit, offset: offset });
        }
      } else {
        assetRecord.push({ asset: ast.asset, limit: limit, offset: offset });
      }
    });
    this.exportReadings(assetRecord, fileName);
  }

  exportReadings(assets: [], fileName: string) {
    let assetReadings = [];
    this.assetService.getMultiAssetsReadings(assets).
      subscribe(
        (result: any) => {
          assetReadings = [].concat.apply([], result);
          this.generateCsv.download(assetReadings, fileName, 'service');
        },
        error => {
          console.log('error in response', error);
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
  }

  onNotify(newFilter) {
    if (newFilter) {
      this.isnewFilterAdded = true;
      const catName = this.service.name + '_' + newFilter.name;
      this.selectedFilterPlugin = newFilter.plugin;
      if ('script' in newFilter.filter_config) {
        let fileReader = new FileReader();
        fileReader.onload = () => {
          newFilter.config = newFilter.config.map(c => {
            c['script'].value = fileReader.result;
            return c;
          });
          this.filterConfiguration.push({ key: catName, 'value': newFilter.config });
        }
        fileReader.readAsText(newFilter.filter_config['script'][0]['script']);
        this.filesToUpload.push({ key: catName, script: newFilter.filter_config['script'] });
        newFilter.filter_config = omit(newFilter.filter_config, 'script')
      } else {
        this.filterConfiguration.push({ key: catName, 'value': newFilter.config });
      }

      this.newFilters.push(newFilter);
      this.filterPipeline.push({ name: newFilter.name, isFilterSaved: false })
    }

    this.isWizard = false;
    this.useProxy = 'true';
    this.isAdvanceConfig = false;
    this.advanceConfigButtonText = 'Show Advanced Config';
  }

  /**
   * Add filter
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
    this.filterService.addFilterPipeline(payload, this.service.name).
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
      }, error => {
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

  getFilterPipeline() {
    this.filterService.getFilterPipeline(this.service['name'])
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

  activeAccordion(id, filter: any) {
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
        this.getFilterConfiguration(filter.name);
      } else {
        last.classList.remove('is-active');
        lastActiveContentBody.hidden = true;
      }
    } else {
      const element = <HTMLElement>document.getElementById(id);
      const body = <HTMLElement>element.getElementsByClassName('card-content')[0];
      body.hidden = false;
      element.setAttribute('class', 'accordion card is-active');
      this.getFilterConfiguration(filter);
    }
  }

  getFilterConfiguration(filter: any) {
    if (!filter.isFilterSaved) {
      return;
    }
    const catName = this.service['name'] + '_' + filter.name;
    this.filterService.getFilterConfiguration(catName)
      .subscribe((data: any) => {
        this.filterConfiguration.push({ key: catName, 'value': [data] });
        this.selectedFilterPlugin = data.plugin.value;
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
    const catName = this.service['name'] + '_' + filterName;
    return this.filterConfiguration.find(f => f.key === catName);
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
    this.filterService.updateFilterPipeline({ 'pipeline': pipeline }, this.service['name'])
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

  goToLink(pluginInfo) {
    this.docService.goToPluginLink(pluginInfo);
  }

  discardChanges() {
    this.isFilterOrderChanged = false;
    this.isFilterDeleted = false;
    this.isnewFilterAdded = false;
    this.deletedFilterPipeline = [];
    this.newFilters = [];
    this.toggleModal(false);
  }
}
