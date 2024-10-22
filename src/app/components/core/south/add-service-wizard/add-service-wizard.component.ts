import { Component, Input, OnInit, ViewChild, OnDestroy, ChangeDetectorRef, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { cloneDeep, sortBy } from 'lodash';

import {
  AlertService, SchedulesService, SharedService, ServicesApiService,
  PluginService, ProgressBarService, FileUploaderService,
  ConfigurationControlService
} from '../../../../services';
import { ViewLogsComponent } from '../../logs/packages-log/view-logs/view-logs.component';
import { DocService } from '../../../../services/doc.service';
import { CustomValidator } from '../../../../directives/custom-validator';
import { QUOTATION_VALIDATION_PATTERN } from '../../../../utils';

@Component({
  selector: 'app-add-service-wizard',
  templateUrl: './add-service-wizard.component.html',
  styleUrls: ['./add-service-wizard.component.css']
})
export class AddServiceWizardComponent implements OnInit, OnDestroy {

  public plugins = [];
  public configurationData;
  public pluginConfiguration: any;
  public selectedPluginDescription = '';
  public plugin: any;
  public serviceType = 'South';
  public isScheduleEnabled = true;
  public schedulesName = [];
  public showSpinner = false;
  private subscription: Subscription;
  public source = '';

  // to hold child form state
  validConfigurationForm = true;
  QUOTATION_VALIDATION_PATTERN = QUOTATION_VALIDATION_PATTERN;

  serviceForm: UntypedFormGroup;

  public reenableButton = new EventEmitter<boolean>(false);

  @Input() categoryConfigurationData;
  @ViewChild(ViewLogsComponent) viewLogsComponent: ViewLogsComponent;

  public pluginData = {
    modalState: false,
    type: this.serviceType,
    pluginName: ''
  };
  isTabsNavVisible = false;

  constructor(private formBuilder: UntypedFormBuilder,
    private servicesApiService: ServicesApiService,
    private pluginService: PluginService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private schedulesService: SchedulesService,
    private ngProgress: ProgressBarService,
    private sharedService: SharedService,
    private docService: DocService,
    private configurationControlService: ConfigurationControlService,
    private fileUploaderService: FileUploaderService,
    private cdRef: ChangeDetectorRef
  ) {
    this.route.queryParams.subscribe(params => {
      if (params['source']) {
        this.source = params['source'];
      }
    });
  }

  ngOnInit() {
    this.getSchedules();
    this.serviceForm = this.formBuilder.group({
      name: new UntypedFormControl('', [Validators.required, CustomValidator.nospaceValidator]),
      plugin: new UntypedFormControl('', [Validators.required, CustomValidator.pluginsCountValidator]),
      config: new UntypedFormControl(null)
    });
    this.getInstalledSouthPlugins();
    this.subscription = this.sharedService.showLogs.subscribe(showPackageLogs => {
      if (showPackageLogs.isSubscribed) {
        // const closeBtn = <HTMLDivElement>document.querySelector('.modal .delete');
        // if (closeBtn) {
        //   closeBtn.click();
        // }
        this.viewLogsComponent.toggleModal(true, showPackageLogs.fileLink);
        showPackageLogs.isSubscribed = false;
      }
    });
  }

  movePrevious() {
    const last = <HTMLElement>document.getElementsByClassName('step-item is-active')[0];
    const id = last.getAttribute('id');
    if (+id === 1) {
      if (this.source) {
        this.router.navigate(['/flow/editor/south'])
      } else {
        this.router.navigate(['/south']);
      }
      return;
    }
    last.classList.remove('is-active');
    const sId = +id - 1;
    const previous = <HTMLElement>document.getElementById('' + sId);
    previous.setAttribute('class', 'step-item is-active');

    const stepContent = <HTMLElement>document.getElementById('c-' + id);
    if (stepContent != null) {
      stepContent.classList.remove('is-active');
    }

    const nextContent = <HTMLElement>document.getElementById('c-' + sId);
    if (nextContent != null) {
      this.isTabsNavVisible = +id == 1 ? true : false;
      nextContent.setAttribute('class', 'box step-content  is-active');
    }

    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const previousButton = <HTMLButtonElement>document.getElementById('previous');
    switch (+id) {
      case 2:
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Cancel';
        nxtButton.disabled = false;
        break;
      case 3:
        nxtButton.textContent = 'Next';
        nxtButton.disabled = false;
        break;
      default:
        break;
    }
  }

  selectPlugin(selectedPlugin: string) {
    this.validConfigurationForm = true;
    this.configurationData = null;
    this.pluginConfiguration = null;
    this.plugin = (selectedPlugin.slice(3).trim()).replace(/'/g, '');
    const pluginInfo = cloneDeep(this.plugins?.find(p => p.name === this.plugin));
    if (pluginInfo) {
      pluginInfo.config = this.configurationControlService.getValidConfig(pluginInfo.config);
      this.configurationData = pluginInfo;
      this.pluginConfiguration = cloneDeep(pluginInfo);
      this.selectedPluginDescription = pluginInfo.description;
      this.serviceForm.controls['config'].patchValue(pluginInfo?.config);
      this.serviceForm.controls['config'].updateValueAndValidity({ onlySelf: true });
      this.isScheduleEnabled = true; // reset to default
      this.cdRef.detectChanges();
    }
  }

  /**
   * Open plugin modal
   */
  openPluginModal() {
    this.pluginData = {
      modalState: true,
      type: this.serviceType,
      pluginName: ''
    };
  }

  moveNext() {
    const formValues = this.serviceForm.value;
    const first = <HTMLElement>document.getElementsByClassName('step-item is-active')[0];
    const id = first.getAttribute('id');
    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const previousButton = <HTMLButtonElement>document.getElementById('previous');
    this.isTabsNavVisible = +id == 1 ? true : false;

    switch (+id) {
      case 1:
        // To verify if service with given name already exist
        const isServiceNameExist = this.schedulesName.some(item => {
          return formValues['name'].trim() === item.name;
        });
        if (isServiceNameExist) {
          this.alertService.error('A service/task already exists with this name.');
          this.reenableButton.emit(false);
          return false;
        }
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Previous';

        // check if configuration form is valid or invalid
        this.validConfigurationForm ? nxtButton.disabled = false : nxtButton.disabled = true;
        break;
      case 2:
        this.reenableButton.emit(false);
        nxtButton.textContent = 'Done';
        previousButton.textContent = 'Previous';
        break;
      case 3:
        this.addService();
        break;
      default:
        break;
    }

    if (+id >= 3) {
      return false;
    }

    first.classList.remove('is-active');
    first.classList.add('is-completed');
    const sId = +id + 1;
    const next = <HTMLElement>document.getElementById('' + sId);
    if (next != null) {
      next.setAttribute('class', 'step-item is-active');
    }

    const stepContent = <HTMLElement>document.getElementById('c-' + id);
    if (stepContent != null) {
      stepContent.classList.remove('is-active');
    }

    const nextContent = <HTMLElement>document.getElementById('c-' + sId);
    if (nextContent != null) {
      nextContent.setAttribute('class', 'box step-content is-active');
    }
  }

  /**
   * Get edited configuration from view config child page
   * @param changedConfig changed configuration of a selected plugin
   */
  getChangedConfig(changedConfig: any) {
    const config = this.configurationControlService.getChangedConfiguration(changedConfig, this.pluginConfiguration, true);
    this.serviceForm.controls['config'].patchValue(config);
    this.serviceForm.controls['config'].updateValueAndValidity({ onlySelf: true });
  }

  /**
   * Method to add service
   * @param payload  to pass in request
   */
  addService() {
    let config = this.serviceForm?.value['config'];
    const payload = {
      name: this.serviceForm.value['name'].trim(),
      type: this.serviceType.toLowerCase(),
      plugin: this.serviceForm.value['plugin'][0],
      ...config && { config },
      enabled: this.isScheduleEnabled
    };

    // extract script files to upload from final payload
    const files = this.getScriptFilesToUpload(payload.config);

    /** request started */
    this.ngProgress.start();
    this.servicesApiService.addService(payload)
      .subscribe(
        (response) => {
          /** request done */
          this.ngProgress.done();
          this.reenableButton.emit(false);
          this.alertService.success(response['name'] + ' service added successfully.', true);
          if (files.length > 0) {
            const name = payload.name
            this.uploadScript(name, files);
          }
          if (this.source === 'flowEditor') {
            this.router.navigate(['/flow/editor/south', response['name'], 'details']);
          }
          else {
            this.router.navigate(['/south']);
          }
        },
        (error) => {
          /** request done */
          this.ngProgress.done();
          this.reenableButton.emit(false);
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  getScriptFilesToUpload(configuration: any) {
    return this.fileUploaderService.getConfigurationPropertyFiles(configuration, true);
  }

  /**
  * To upload script files of a configuration property
  * @param categoryName name of the configuration category
  * @param files : Scripts array to uplaod
  */
  public uploadScript(categoryName: string, files: any[]) {
    this.fileUploaderService.uploadConfigurationScript(categoryName, files);
  }

  public getInstalledSouthPlugins(pluginInstalled?: boolean) {
    /** request started */
    this.showLoadingSpinner();
    this.pluginService.getInstalledPlugins(this.serviceType.toLowerCase()).subscribe(
      (data: any) => {
        /** request completed */
        this.hideLoadingSpinner();
        this.plugins = sortBy(data.plugins, p => {
          return p.name.toLowerCase();
        });
      },
      (error) => {
        /** request completed */
        this.hideLoadingSpinner();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      },
      () => {
        setTimeout(() => {
          if (pluginInstalled) {
            this.selectInstalledPlugin();
          }
        }, 1000);
      });
  }

  onCheckboxClicked(event) {
    if (event.target.checked) {
      this.isScheduleEnabled = true;
    } else {
      this.isScheduleEnabled = false;
    }
  }

  public getSchedules(): void {
    this.schedulesName = [];
    /** request started */
    this.ngProgress.start();
    this.schedulesService.getSchedules().
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          // To filter
          this.schedulesName = data['schedules'];
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

  onNotify(event: any) {
    this.pluginData.modalState = event.modalState;
    this.pluginData.pluginName = event.name;
    if (event.pluginInstall) {
      this.getInstalledSouthPlugins(event.pluginInstall);
    }
  }

  selectInstalledPlugin() {
    const select = <HTMLSelectElement>document.getElementById('pluginSelect');
    for (let i = 0, j = select.options.length; i < j; ++i) {
      if (select.options[i].innerText.toLowerCase() === this.pluginData.pluginName.toLowerCase()) {
        this.serviceForm.controls['plugin'].setValue([this.plugins[i].name]);
        select.selectedIndex = i;
        select.dispatchEvent(new Event('change'));
        break;
      }
    }
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  goToLink() {
    const pluginInfo = {
      name: this.plugin,
      type: 'South'
    };
    this.docService.goToPluginLink(pluginInfo);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
