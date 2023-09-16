import {
  ChangeDetectorRef,
  Component, EventEmitter, Input, OnInit, Output, ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { cloneDeep, isEmpty } from 'lodash';

import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertService, AssetsService,
  ConfigurationControlService,
  ConfigurationService,
  FileUploaderService,
  FilterService,
  GenerateCsvService,
  ProgressBarService,
  ResponseHandler, RolesService,
  SchedulesService, ServicesApiService, ToastService
} from '../../../../services';
import { DocService } from '../../../../services/doc.service';
import { MAX_INT_SIZE } from '../../../../utils';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { FilterAlertComponent } from '../../filter/filter-alert/filter-alert.component';
import { ConfigurationGroupComponent } from '../../configuration-manager/configuration-group/configuration-group.component';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Service } from '../south-service';
import { FilterListComponent } from '../../filter/filter-list/filter-list.component';
import { AddFilterWizardComponent } from '../../filter/add-filter-wizard/add-filter-wizard.component';


@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit {

  public category: any;
  svcCheckbox: FormControl = new FormControl();
  public filterPipeline: string[] = [];
  public applicationTagClicked = false;
  public unsavedChangesInFilterForm = false;

  assetReadings = [];
  public isAddFilterWizard;

  confirmationDialogData = {};
  MAX_RANGE = MAX_INT_SIZE / 2;

  @Input() service: Service;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('pluginConfigComponent') pluginConfigComponent: ConfigurationGroupComponent;
  @ViewChild('filtersListComponent') filtersListComponent: FilterListComponent;
  @ViewChild('AddFilterWizardComponent') AddFilterWizardComponent: AddFilterWizardComponent;
  @ViewChild(FilterAlertComponent) filterAlert: FilterAlertComponent;

  // to hold child form state
  validConfigurationForm = true;
  validFilterConfigForm = true;
  pluginConfiguration;
  changedConfig: any;
  advancedConfiguration = [];

  // hold all api calls in stack
  apiCallsStack = [];
  serviceName: string

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
    private _Activatedroute: ActivatedRoute,
    private fileUploaderService: FileUploaderService,
    private configurationControlService: ConfigurationControlService,
    public rolesService: RolesService,
    private response: ResponseHandler,
    private toastService: ToastService,
    public cDRef: ChangeDetectorRef) {
    this.serviceName = this._Activatedroute.snapshot.paramMap.get('service');
    if (this.serviceName) {
      this.getService();
    }
  }


  public getService() {
    this.ngProgress.start();
    this.servicesApiService.getServiceByName(this.serviceName)
      .subscribe((res: any) => {
        console.log('res', res);
        this.ngProgress.done();
        this.service = res;
        this.toggleModal();
      },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          }
        });
  }

  ngOnInit() { }

  ngAfterViewChecked() {
    this.cDRef.detectChanges();
  }

  getCategoryData() {
    this.getCategory();
    this.getFilterPipeline();
  }

  refreshPageData() {
    if (this.pluginConfiguration) {
      const pluginConfigCopy = cloneDeep(this.pluginConfiguration);
      this.pluginConfigComponent?.updateCategroyConfig(pluginConfigCopy.config);
    }
    this.svcCheckbox.setValue(this.service.schedule_enabled);
  }

  public toggleModal() {
    this.applicationTagClicked = false;
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

    //if (this.isAddFilterWizard) {
    this.getCategoryData();
    this.isAddFilterWizard = false;
    //}

    // const modalWindow = <HTMLDivElement>document.getElementById('south-service-modal');
    //if (isOpen) {
    // this.getCategoryData();
    this.validConfigurationForm = true;
    this.validFilterConfigForm = true;
    this.notify.emit(false);
    this.svcCheckbox.setValue(this.service.schedule_enabled);
    if (!this.rolesService.hasEditPermissions()) {
      this.svcCheckbox.disable()
    }
    // modalWindow.classList.add('is-active');
    // return;
    //}
    this.pluginConfiguration = {};
    this.changedConfig = {};
    this.advancedConfiguration = [];
    this.apiCallsStack = [];
    this.category = null;
    this.notify.emit(false);
    //modalWindow.classList.remove('is-active');
  }

  public getCategory(): void {
    /** request started */
    this.ngProgress.start();
    this.configService.getCategory(this.service.name).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            this.category = { name: this.service.name, config: data };
            this.pluginConfiguration = cloneDeep({ name: this.service.name, config: data });
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
      .pipe(map(() => ({ type: 'schedule', success: true })))
      .pipe(catchError(e => of({ error: e, failed: true }))));
  }

  public enableSchedule(serviceName) {
    this.apiCallsStack.push(this.schedulesService.enableScheduleByName(serviceName)
      .pipe(map(() => ({ type: 'schedule', success: true })))
      .pipe(catchError(e => of({ error: e, failed: true }))));
  }

  changeServiceStatus() {
    if (!this.svcCheckbox.dirty && !this.svcCheckbox.touched) {
      return false;
    }
    const serviceName = this.service.name;
    const serviceCurrentStatus = this.service.schedule_enabled;
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

  filterFormStatus(status: boolean) {
    this.unsavedChangesInFilterForm = status;
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

  getAssetReadings(service: Service) {
    this.assetReadings = [];
    const fileName = service.name + '-readings';
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
    if (this.unsavedChangesInFilterForm) {
      this.filtersListComponent.discard();
    }
    this.ngProgress.start();
    this.servicesApiService.deleteService(svc.name)
      .subscribe(
        (data) => {
          this.ngProgress.done();
          this.alertService.success(data['result'], true);
          //this.toggleModal(false);
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
    if (this.unsavedChangesInFilterForm) {
      this.showConfirmationDialog();
      return;
    }
    this.isAddFilterWizard = isClicked;
    this.category = '';
  }

  onNotify() {
    this.getCategory();
    this.isAddFilterWizard = false;
    this.getFilterPipeline();
  }

  openAddFilter(node) {
    console.log('node', node);
    this.openAddFilterModal(true);
  }

  getFilterPipeline() {
    this.filterService.getFilterPipeline(this.service.name)
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

  goToLink(pluginInfo) {
    this.docService.goToPluginLink(pluginInfo);
  }

  navToSyslogs(service: Service) {
    this.router.navigate(['logs/syslog'], { queryParams: { source: service.name } });
  }

  discardUnsavedChanges() {
    this.filtersListComponent.discard();
    if (this.applicationTagClicked) {
      this.isAddFilterWizard = this.applicationTagClicked;
      return;
    }
    // this.toggleModal(false);
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

  /**
   * To upload script files of a configuration property
   * @param categoryName name of the configuration category
   * @param files : Scripts array to uplaod
   */
  public uploadScript(categoryName: string, files: any[]) {
    this.fileUploaderService.uploadConfigurationScript(categoryName, files);
    if (isEmpty(this.changedConfig) && isEmpty(this.advancedConfiguration)) //&& isEmpty(this.changedFilterConfig))
    {
      // this.toggleModal(false);
    }
  }

  save() {
    this.changeServiceStatus();
    if (!isEmpty(this.changedConfig) && this.pluginConfiguration?.name) {
      this.updateConfiguration(this.pluginConfiguration.name, this.changedConfig, 'plugin-config');
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
        //this.toggleModal(false);
      }
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
              this.toastService.error(r.error.statusText);
            }
          } else {
            this.response.handleResponseMessage(r.type);
          }
        });
        this.notify.emit();
        //this.toggleModal(false);
        this.apiCallsStack = [];
      });
    }
  }

  checkFormState() {
    const serviceStateChanged = this.svcCheckbox?.value !== this.service?.schedule_enabled
    const noChange = isEmpty(this.changedConfig) && isEmpty(this.advancedConfiguration) && !this.unsavedChangesInFilterForm && !serviceStateChanged;
    return noChange;
  }

}
