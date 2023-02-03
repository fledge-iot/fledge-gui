import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { cloneDeep, isEmpty } from 'lodash';

import { Router } from '@angular/router';
import {
  AlertService, AssetsService, ConfigurationControlService, ConfigurationService,
  FileUploaderService, FilterService, GenerateCsvService, ProgressBarService, RolesService,
  SchedulesService, ServicesApiService
} from '../../../../services';
import { DocService } from '../../../../services/doc.service';
import { MAX_INT_SIZE } from '../../../../utils';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { FilterAlertComponent } from '../../filter/filter-alert/filter-alert.component';
import { ConfigurationGroupComponent } from '../../configuration-manager/configuration-group/configuration-group.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-south-service-modal',
  templateUrl: './south-service-modal.component.html',
  styleUrls: ['./south-service-modal.component.css']
})
export class SouthServiceModalComponent implements OnInit {

  public category: any;
  svcCheckbox: FormControl = new FormControl();
  public filterPipeline = [];
  public deletedFilterPipeline = [];
  public filterConfiguration: any;
  filterConfigurationCopy: any;

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
  @ViewChild('pluginConfigComponent') pluginConfigComponent: ConfigurationGroupComponent;
  @ViewChild('filterConfigComponent') filterConfigComponent: ConfigurationGroupComponent;
  @ViewChild(FilterAlertComponent) filterAlert: FilterAlertComponent;

  // to hold child form state
  validConfigurationForm = true;
  validFilterConfigForm = true;
  pluginConfiguration;
  changedConfig: any;
  changedFilterConfig: any;
  advancedConfiguration = [];

  // hold all api calls in stack
  apiCallsStack = [];

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
    private fileUploaderService: FileUploaderService,
    private configurationControlService: ConfigurationControlService,
    public rolesService: RolesService) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    const alertModal = <HTMLDivElement>document.getElementById('modal-box');
    if (!alertModal.classList.contains('is-active')) {
      this.toggleModal(false);
    }
  }

  ngOnInit() { }

  getCategoryData() {
    this.getCategory();
    this.getFilterPipeline();
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
      this.getCategoryData();
      this.isAddFilterWizard = false;
    }

    const modalWindow = <HTMLDivElement>document.getElementById('south-service-modal');
    if (isOpen) {
      this.getCategoryData();
      this.validConfigurationForm = true;
      this.validFilterConfigForm = true;
      this.notify.emit(false);
      this.svcCheckbox.setValue(this.service['schedule_enabled']);
      if (!this.rolesService.hasEditPermissions()) {
        this.svcCheckbox.disable()
      }
      modalWindow.classList.add('is-active');
      return;
    }
    this.pluginConfiguration = {};
    this.filterConfiguration = {};
    this.changedConfig = {};
    this.changedFilterConfig = {};
    this.advancedConfiguration = [];
    this.apiCallsStack = [];
    this.category = null;
    this.notify.emit(false);
    modalWindow.classList.remove('is-active');
  }

  public getCategory(): void {
    /** request started */
    this.ngProgress.start();
    this.configService.getCategory(this.service['name']).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            this.category = { name: this.service['name'], config: data };
            this.pluginConfiguration = cloneDeep({ name: this.service['name'], config: data });
            this.refreshPageData();
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
    this.apiCallsStack.push(this.schedulesService.disableScheduleByName(serviceName)
      .pipe(catchError(e => of(e))));
  }

  public enableSchedule(serviceName) {
    this.apiCallsStack.push(this.schedulesService.enableScheduleByName(serviceName)
      .pipe(catchError(e => of(e))));
  }

  saveServiceChanges() {
    if (this.isFilterDeleted) {
      this.deleteFilter();
    }
    if (this.isFilterOrderChanged) {
      this.updateFilterPipeline(this.filterPipeline);
    }
    this.changeServiceStatus();
  }

  changeServiceStatus() {
    if (!this.svcCheckbox.dirty && !this.svcCheckbox.touched) {
      return false;
    }
    const serviceName = this.service['name'];
    const serviceCurrentStatus = this.service['schedule_enabled'];
    const serviceChangedStatus = this.svcCheckbox.value;
    if (serviceCurrentStatus === serviceChangedStatus) {
      return;
    }

    if (serviceChangedStatus) {
      this.enableSchedule(serviceName);
      this.svcCheckbox.reset(true);
    } else {
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
        this.selectedFilterPlugin = data.plugin.value;
        this.filterConfiguration = { key: catName, config: data };
        this.filterConfigurationCopy = cloneDeep({ key: catName, config: data });
        this.filterConfigComponent?.updateCategroyConfig(data);
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
   * Get edited south service configuration from show configuration page
   * @param changedConfiguration changed configuration of a selected plugin
   */
  getChangedConfig(changedConfiguration: any) {
    this.changedConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, this.pluginConfiguration);
  }

  /**
  * Get edited south service advanced & security configuration
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
  updateConfiguration(categoryName: string, configuration: any) {
    const files = this.getScriptFilesToUpload(configuration);
    if (files.length > 0) {
      this.uploadScript(categoryName, files);
    }

    if (isEmpty(configuration)) {
      return;
    }
    this.apiCallsStack.push(this.configService.
      updateBulkConfiguration(categoryName, configuration).pipe(catchError(e => of(e))));
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

  save() {
    this.saveServiceChanges();
    if (!isEmpty(this.changedConfig) && this.pluginConfiguration?.name) {
      this.updateConfiguration(this.pluginConfiguration.name, this.changedConfig);
    }
    if (!isEmpty(this.changedFilterConfig) && this.filterConfigurationCopy?.key) {
      this.updateConfiguration(this.filterConfigurationCopy.key, this.changedFilterConfig);
    }

    if (!isEmpty(this.advancedConfiguration)) {
      this.advancedConfiguration.forEach(element => {
        this.updateConfiguration(element.key, element.config);
      });
    }

    if (this.apiCallsStack.length > 0) {
      this.ngProgress.start();
      forkJoin(this.apiCallsStack).subscribe(() => {
        this.ngProgress.done();
        this.alertService.success('Configuration updated successfully.', true);
        this.notify.emit();
        this.toggleModal(false);
        this.apiCallsStack = [];
      });
    } else {
      this.toggleModal(false);
    }
  }
}
