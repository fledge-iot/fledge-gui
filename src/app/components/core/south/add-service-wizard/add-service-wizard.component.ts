import { Component, Input, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { cloneDeep, sortBy } from 'lodash';

import {
  AlertService, SchedulesService, SharedService, ServicesApiService,
  PluginService, ProgressBarService, FileUploaderService,
  ConfigurationControlService
} from '../../../../services';
import { ViewLogsComponent } from '../../logs/packages-log/view-logs/view-logs.component';
import { DocService } from '../../../../services/doc.service';

@Component({
  selector: 'app-add-service-wizard',
  templateUrl: './add-service-wizard.component.html',
  styleUrls: ['./add-service-wizard.component.css']
})
export class AddServiceWizardComponent implements OnInit, OnDestroy {

  public plugins = [];
  public configurationData;
  public pluginConfiguration: any;
  public isValidPlugin = true;
  public isSinglePlugin = true;
  public selectedPluginDescription = '';
  public plugin: any;
  public isValidName = true;
  public serviceType = 'South';
  public isScheduleEnabled = true;
  public payload: any;
  public schedulesName = [];
  public showSpinner = false;
  private subscription: Subscription;

  // to hold child form state
  validConfigurationForm = true;

  serviceForm = new FormGroup({
    name: new FormControl(),
    plugin: new FormControl()
  });

  @Input() categoryConfigurationData;
  @ViewChild(ViewLogsComponent) viewLogsComponent: ViewLogsComponent;

  public pluginData = {
    modalState: false,
    type: this.serviceType,
    pluginName: ''
  };
  constructor(private formBuilder: FormBuilder,
    private servicesApiService: ServicesApiService,
    private pluginService: PluginService,
    private alertService: AlertService,
    private router: Router,
    private schedulesService: SchedulesService,
    private ngProgress: ProgressBarService,
    private sharedService: SharedService,
    private docService: DocService,
    private configurationControlService: ConfigurationControlService,
    private fileUploaderService: FileUploaderService
  ) { }

  ngOnInit() {
    this.getSchedules();
    this.serviceForm = this.formBuilder.group({
      name: ['', Validators.required],
      plugin: ['', Validators.required]
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
      this.router.navigate(['/south']);
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
      nextContent.setAttribute('class', 'box step-content  is-active');
    }

    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const previousButton = <HTMLButtonElement>document.getElementById('previous');
    switch (+id) {
      case 2:
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Back';
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

  getDescription(selectedPlugin) {
    if (selectedPlugin === '') {
      this.isValidPlugin = false;
      this.selectedPluginDescription = '';
      this.serviceForm.value['plugin'] = '';
    } else {
      this.isSinglePlugin = true;
      this.isValidPlugin = true;
      this.plugin = (selectedPlugin.slice(3).trim()).replace(/'/g, '');
      this.selectedPluginDescription = this.plugins.find(p => p.name === this.plugin).description;
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
    this.isValidPlugin = true;
    this.isValidName = true;
    const formValues = this.serviceForm.value;
    const first = <HTMLElement>document.getElementsByClassName('step-item is-active')[0];
    const id = first.getAttribute('id');
    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const previousButton = <HTMLButtonElement>document.getElementById('previous');
    switch (+id) {
      case 1:
        if (formValues['plugin'] === '') {
          this.isValidPlugin = false;
          return;
        }

        if (formValues['plugin'].length !== 1) {
          this.isSinglePlugin = false;
          return;
        }

        if (formValues['name'].trim() === '') {
          this.isValidName = false;
          return;
        }
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Previous';

        // To verify if service with given name already exist
        const isServiceNameExist = this.schedulesName.some(item => {
          return formValues['name'].trim() === item.name;
        });
        if (isServiceNameExist) {
          this.alertService.error('A service/task already exists with this name.');
          return false;
        }

        // create payload to pass in add service
        if (formValues['name'].trim() !== '' && formValues['plugin'].length > 0) {
          this.payload = {
            name: formValues['name'],
            type: this.serviceType.toLowerCase(),
            plugin: formValues['plugin'][0],
            enabled: this.isScheduleEnabled
          };
        }
        this.getConfiguration();
        break;
      case 2:
        nxtButton.textContent = 'Done';
        previousButton.textContent = 'Previous';
        break;
      case 3:
        this.addService(this.payload);
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
   *  Get default configuration of a selected plugin
   */
  private getConfiguration(): void {
    const plugin = this.plugins.find(p => p.name === this.payload.plugin);
    if (plugin) {
      this.configurationData = plugin;
      this.pluginConfiguration = cloneDeep(plugin);
    }
  }

  /**
   * Get edited configuration from view config child page
   * @param changedConfig changed configuration of a selected plugin
   */
  getChangedConfig(changedConfig: any) {
    this.payload.config = this.configurationControlService.getChangedConfiguration(changedConfig, this.pluginConfiguration, true);
  }

  /**
   * Method to add service
   * @param payload  to pass in request
   */
  public addService(payload) {
    // extract script files to upload from final payload
    const files = this.getScriptFilesToUpload(payload.config);

    /** request started */
    this.ngProgress.start();
    this.servicesApiService.addService(payload)
      .subscribe(
        (response) => {
          /** request done */
          this.ngProgress.done();
          this.alertService.success(response['name'] + ' service added successfully.', true);
          if (files.length > 0) {
            const name = this.payload.name
            this.uploadScript(name, files);
          }
          this.router.navigate(['/south']);
        },
        (error) => {
          /** request done */
          this.ngProgress.done();
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

  validateServiceName(event) {
    if (event.target.value.trim().length > 0) {
      this.isValidName = true;
    }
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
    this.payload.enabled = this.isScheduleEnabled;
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
