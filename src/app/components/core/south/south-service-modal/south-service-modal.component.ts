import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, QueryList, ViewChild, ViewChildren
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { assign, cloneDeep, reduce, isEmpty, map } from 'lodash';

import { Router } from '@angular/router';
import {
  AlertService, AssetsService, ConfigurationService, FilterService, GenerateCsvService, ProgressBarService, RolesService, SchedulesService,
  ServicesApiService
} from '../../../../services';
import { DocService } from '../../../../services/doc.service';
import { MAX_INT_SIZE } from '../../../../utils';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { ConfigChildrenComponent } from '../../configuration-manager/config-children/config-children.component';
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
  public isEnabled = false;
  svcCheckbox: FormControl = new FormControl();
  public filterPipeline = [];
  public deletedFilterPipeline = [];
  public filterConfiguration = [];

  public isFilterOrderChanged = false;
  public isFilterDeleted = false;
  public applicationTagClicked = false;

  assetReadings = [];
  public filterItemIndex;
  public isAddFilterWizard;
  // Object to hold data of south service to delete
  public selectedFilterPlugin;

  confirmationDialogData = {};
  MAX_RANGE = MAX_INT_SIZE / 2;

  @Input() service: { service: any };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChildren('filterConfigView') filterConfigViewComponents: QueryList<ViewConfigItemComponent>;
  @ViewChild('configChildComponent') configChildComponent: ConfigChildrenComponent;
  @ViewChild(FilterAlertComponent) filterAlert: FilterAlertComponent;

  // to hold child form state
  validConfigurationForm = true;
  validFilterConfigForm = true;
  private filesToUpload = [];
  pluginConfiguration;
  changedConfig = {};

  constructor(
    private router: Router,
    private configService: ConfigurationService,
    private alertService: AlertService,
    private assetService: AssetsService,
    private filterService: FilterService,
    public ngProgress: ProgressBarService,
    public generateCsv: GenerateCsvService,
    private servicesApiService: ServicesApiService,
    private schedulesService: SchedulesService,
    private dialogService: DialogService,
    private docService: DocService,
    public rolesService: RolesService) { }

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
    this.getCateogryData();
  }

  getCateogryData() {
    if (this.service !== undefined) {
      this.getCategory();
      this.getFilterPipeline();
    }
  }

  refreshPageData() {
    this.getCateogryData();
    if (this.configChildComponent) {
      this.configChildComponent.getChildConfigData();
    }
    this.svcCheckbox.setValue(this.service['schedule_enabled']);
  }

  onDrop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    moveItemInArray(this.filterPipeline, event.previousIndex, event.currentIndex);
    this.isFilterOrderChanged = true;
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

    const modalWindow = <HTMLDivElement>document.getElementById('south-service-modal');
    if (isOpen) {
      this.notify.emit(false);
      this.svcCheckbox.setValue(this.service['schedule_enabled']);
      if (!this.rolesService.hasEditPermissions()) {
        this.svcCheckbox.disable()
      }
      modalWindow.classList.add('is-active');
      return;
    }
    this.notify.emit(false);
    this.filterConfiguration = [];
    this.category = null;
    modalWindow.classList.remove('is-active');
  }

  public getCategory(): void {
    /** request started */
    this.ngProgress.start();
    this.configService.getCategory(this.service['name']).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            this.category = { key: this.service['name'], config: data };
            this.pluginConfiguration = cloneDeep({ key: this.service['name'], config: data });
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

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
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
          this.closeModal('delete-service-dialog');
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

  openAddFilterModal(isClicked: boolean) {
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

  activeAccordion(id, filterName: string) {
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

  getFilterConfiguration(filterName: string) {
    const catName = this.service['name'] + '_' + filterName;
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
    this.filterPipeline = this.filterPipeline.filter(f => f !== filter);
    this.isFilterDeleted = true;
    this.isFilterOrderChanged = false;
  }


  deleteFilter() {
    this.isFilterDeleted = false;
    this.ngProgress.start();
    this.filterService.updateFilterPipeline({ 'pipeline': this.filterPipeline }, this.service['name'])
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

  navToSyslogs(service) {
    this.router.navigate(['logs/syslog'], { queryParams: { source: service.name } });
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
}
