import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { sortBy, isEmpty, cloneDeep } from 'lodash';

import {
  AlertService, ConfigurationService, FilterService, ServicesApiService,
  ProgressBarService, FileUploaderService,
  ConfigurationControlService
} from '../../../../services';
import { concatMap, delayWhen, retryWhen, take, tap } from 'rxjs/operators';
import { of, Subscription, throwError, timer } from 'rxjs';
import { DocService } from '../../../../services/doc.service';
import { CustomValidator } from '../../../../directives/custom-validator';
import {QUOTATION_VALIDATION_PATTERN} from '../../../../utils';


@Component({
  selector: 'app-add-filter-wizard',
  templateUrl: './add-filter-wizard.component.html',
  styleUrls: ['./add-filter-wizard.component.css']
})
export class AddFilterWizardComponent implements OnInit {

  public plugins = [];
  public categories = [];
  public configurationData;
  public selectedPluginDescription = '';
  public plugin: any;
  public pluginData = [];
  public requestInProgress = false;
  public show = false;
  public stopLoading = false;
  public placeholderText = 'fetching available plugins...';
  increment = 1;
  maxRetry = 15;
  initialDelay = 1000;

  installPluginSub: Subscription;

  serviceForm = new FormGroup({
    name: new FormControl(),
    plugin: new FormControl(),
    pluginToInstall: new FormControl(),
    config: new FormControl(null)
  });

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @Input() serviceName: any;

  validChildConfigurationForm = true;
  pluginConfiguration: any;

  constructor(private formBuilder: FormBuilder,
    private filterService: FilterService,
    private configurationService: ConfigurationService,
    private fileUploaderService: FileUploaderService,
    private alertService: AlertService,
    private service: ServicesApiService,
    private docService: DocService,
    private configurationControlService: ConfigurationControlService,
    private ngProgress: ProgressBarService,
    private cdRef: ChangeDetectorRef) { }

  ngOnInit() {
    this.getCategories();
    this.serviceForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.pattern(QUOTATION_VALIDATION_PATTERN), CustomValidator.nospaceValidator]],
      plugin: [{ value: '', disabled: false }, [Validators.required, CustomValidator.pluginsCountValidator]],
      pluginToInstall: [{ value: null, disabled: false }, [Validators.required]],
      config: [null]
    });
    this.getInstalledFilterPlugins();
  }

  ngAfterContentChecked() {
    this.cdRef.detectChanges();
  }

  toggleAvailablePlugins() {
    if (this.show) {
      this.serviceForm.controls.pluginToInstall.disable();
      this.serviceForm.controls.plugin.enable();
      this.show = false;
      return;
    }
    this.show = true;
    this.serviceForm.controls.pluginToInstall.enable();
    this.getAvailablePlugins('Filter');
  }

  getAvailablePlugins(type: string) {
    this.requestInProgress = true;
    this.service.getAvailablePlugins(type).
      subscribe(
        (data: any) => {
          this.pluginData = data['plugins'].map((p: string) => p.replace(`fledge-filter-`, ''));
          this.requestInProgress = false;
          this.placeholderText = 'Select Plugin';
          if (isEmpty(this.pluginData)) {
            this.stopLoading = true;
            this.alertService.warning('No plugin available to install');
          }
        },
        error => {
          this.stopLoading = true;
          this.requestInProgress = false;
          this.placeholderText = 'Select Plugin';
          if (error.status === 0) {
            console.log('service down ', error);
          } else if (error.status === 404) {
            this.alertService.error('Make sure package repository is configured / added in Fledge');
          } else {
            let errorText = error.statusText;
            if (typeof error.error.link === 'string') {
              errorText += ` <a>${error.error.link}</a>`;
            }
            this.alertService.error(errorText);
          }
        }
      );
  }

  movePrevious() {
    const last = <HTMLElement>document.getElementsByClassName('step-item is-active')[0];
    const id = last.getAttribute('id');
    if (+id === 1) {
      this.notify.emit();
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
      nextContent.setAttribute('class', 'box step-content is-active');
    }

    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    switch (+id) {
      case 2:
        this.serviceForm.controls.plugin.enable();
        nxtButton.textContent = 'Next';
        nxtButton.disabled = false;
        break;
      default:
        break;
    }
  }

  gotoNext() {
    let pluginToInstall: any;
    if (this.serviceForm.value['plugin']) {
      pluginToInstall = this.serviceForm.value['plugin']['0'];
    }
    if (this.serviceForm.value['pluginToInstall']) {
      pluginToInstall = this.serviceForm.value['pluginToInstall'];
    }
    const isPluginInstalled = this.plugins.filter(p => p.name.toLowerCase() === pluginToInstall.toLowerCase());
    if (this.serviceForm.value['pluginToInstall'] && isPluginInstalled.length === 0) {
      this.installPlugin(this.serviceForm.value['pluginToInstall']);
    } else {
      this.moveNext();
    }
  }

  moveNext(pluginInstalled = false) {
    const formValues = this.serviceForm.value;
    const first = <HTMLElement>document.getElementsByClassName('step-item is-active')[0];
    if (first === undefined) {
      return;
    }
    const id = first.getAttribute('id');
    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const previousButton = <HTMLButtonElement>document.getElementById('previous');

    switch (+id) {
      case 1:

        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Previous';

        // To verify if category (or filter itself) with this name already exists
        // hence filter can not be created with that name
        const isFilterExist = this.categories.some(item => {
          return formValues['name'].trim() === item.key;
        });
        if (isFilterExist) {
          this.alertService.error('A filter (or category) with this name already exists.');
          return;
        }
        let pluginValue = '';
        if (formValues['name']?.trim() !== '' && (formValues['plugin']?.length > 0 || formValues['pluginToInstall']?.length > 0)) {
          if (formValues['pluginToInstall']) {
            pluginValue = this.plugins.find(p => p.name.toLowerCase() === formValues['pluginToInstall'].toLowerCase()).name;
          } else {
            pluginValue = this.serviceForm.value['plugin'][0];
          }
        }
        if (pluginInstalled) {
          this.getConfiguration(formValues['name'].trim(), pluginValue);
        }

        nxtButton.textContent = 'Done';
        previousButton.textContent = 'Previous';
        if (!this.validChildConfigurationForm) {
          nxtButton.disabled = true;
        }
        break;
      case 2:
        this.addFilter();
        break;
      default:
        break;
    }

    if (+id >= 2) {
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

  installPlugin(pluginName: string) {
    if (pluginName === undefined) {
      return;
    }
    const pluginData = {
      format: 'repository',
      name: `fledge-filter-` + pluginName,
      version: ''
    };

    /** request started */
    this.ngProgress.start();
    this.serviceForm.controls.pluginToInstall.disable();
    this.serviceForm.controls.plugin.disable({ onlySelf: true });
    this.serviceForm.setErrors({ 'invalid': true });
    this.alertService.activityMessage('Installing ' + pluginName + ' filter plugin...', true);
    this.service.installPlugin(pluginData).
      subscribe(
        (data: any) => {
          /** request done */
          this.monitorFilterPluginInstallationStatus(data, pluginName);
        },
        error => {
          /** request done */
          this.ngProgress.done();
          this.serviceForm.controls.pluginToInstall.enable();
          this.serviceForm.controls.plugin.enable();
          this.serviceForm.setErrors({ 'invalid': false });
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  monitorFilterPluginInstallationStatus(data: any, pluginName: string) {
    this.installPluginSub = this.service.monitorPluginInstallationStatus(data.statusLink)
      .pipe(
        take(1),
        // checking the response object for plugin.
        // if pacakge.status === 'in-progress' then
        // throw an error to re-fetch:
        tap((response: any) => {
          if (response.packageStatus[0].status === 'in-progress') {
            this.increment++;
            throw response;
          }
        }),
        retryWhen(result =>
          result.pipe(
            // only if a server returned an error, stop trying and pass the error down
            tap(installStatus => {
              if (installStatus.error) {
                this.ngProgress.done();
                this.alertService.closeMessage();
                throw installStatus.error;
              }
            }),
            delayWhen(() => {
              const delay = this.increment * this.initialDelay;     // incremental
              console.log(new Date().toLocaleString(), `retrying after ${delay} msec...`);
              return timer(delay);
            }), // delay between api calls
            // Set the number of attempts.
            take(this.maxRetry),
            // Throw error after exceed number of attempts
            concatMap(o => {
              if (this.increment > this.maxRetry) {
                this.ngProgress.done();
                this.alertService.closeMessage();
                // tslint:disable-next-line: max-line-length
                return throwError(`Failed to get expected results in ${this.maxRetry} attempts, tried with incremental time delay starting with 2s, for installing plugin ${pluginName}`);
              }
              return of(o);
            }),
          ))
      ).subscribe(() => {
        this.ngProgress.done();
        this.alertService.closeMessage();
        this.getInstalledFilterPlugins(true);
        this.alertService.success(`Plugin ${pluginName} installed successfully.`);
        this.serviceForm.controls.pluginToInstall.enable();
        this.serviceForm.controls.plugin.enable();
        this.serviceForm.controls.plugin.clearValidators();
        this.serviceForm.controls.plugin.updateValueAndValidity();
        this.serviceForm.setErrors({ 'invalid': false });
      });
  }

  selectPlugin(selectedPlugin: string) {
    this.plugin = (selectedPlugin.slice(3).trim()).replace(/'/g, '');
    const pluginInfo = cloneDeep(this.plugins?.find(p => p.name === this.plugin));
    if (pluginInfo) {
      this.validChildConfigurationForm = true;
      this.configurationData = null;
      this.pluginConfiguration = null;
      this.configurationData = pluginInfo;
      this.pluginConfiguration = cloneDeep(pluginInfo);
      this.selectedPluginDescription = pluginInfo.description;
      this.serviceForm.controls['config'].patchValue(null);
      this.serviceForm.controls['config'].updateValueAndValidity({ onlySelf: true });
      this.serviceForm.controls.pluginToInstall.reset();
      this.serviceForm.controls.pluginToInstall.clearValidators();
      this.serviceForm.controls.pluginToInstall.updateValueAndValidity();
    }
  }

  /**
   *  Get default configuration of a selected plugin
   */
  private getConfiguration(filterName: string, pluginName: string): void {
    const plugin = this.plugins.find(p => p.name.toLowerCase() === pluginName.toLowerCase());
    if (plugin) {
      this.configurationData = { key: this.serviceName + '_' + filterName, config: plugin.config };
      this.pluginConfiguration = cloneDeep(plugin);
    }
  }

  /**
   * Get edited configuration of filter plugin
   * @param changedConfig changed configuration of a selected plugin
   */
  getChangedConfig(changedConfig: any) {
    const filterConfig = this.configurationControlService.getChangedConfiguration(changedConfig, this.pluginConfiguration);
    this.serviceForm.controls['config'].patchValue(filterConfig);
    this.serviceForm.controls['config'].updateValueAndValidity({ onlySelf: true });
  }

  /**
   * Method to add filter
   * @param payload  to pass in request
   */
  public addFilter() {
    let pluginValue;
    if (this.serviceForm.value['pluginToInstall']) {
      pluginValue = this.plugins.find(p => p.name.toLowerCase() === this.serviceForm.value['pluginToInstall'].toLowerCase()).name;
    } else {
      pluginValue = this.serviceForm.value['plugin'][0];
    }

    const payload = {
      name: this.serviceForm.value['name'].trim(),
      plugin: pluginValue,
      ...this.serviceForm.value['config'] && { filter_config: this.serviceForm.value['config'] }
    }

    // extract script files to upload from final payload
    const files = this.getScriptFilesToUpload(payload.filter_config);
    this.filterService.saveFilter(payload)
      .subscribe(
        (data: any) => {
          this.alertService.success(data.filter + ' filter added successfully.', true);
          this.addFilterPipeline({ 'pipeline': [payload.name], files });
        },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  /**
   * To upload script files of a configuration property
   * @param categoryName name of the configuration category
   * @param files : Scripts array to uplaod
   */
  public uploadScript(categoryName: string, files: any[]) {
    this.fileUploaderService.uploadConfigurationScript(categoryName, files);
  }

  public addFilterPipeline(payload) {
    const name = this.serviceForm.value['name'];
    this.filterService.addFilterPipeline(payload, this.serviceName)
      .subscribe((data: any) => {
        this.notify.emit(data);
        if (payload?.files.length > 0) {
          const filterName = this.serviceName + '_' + name
          this.uploadScript(filterName, payload?.files);
        }
      },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  getScriptFilesToUpload(configuration: any) {
    return this.fileUploaderService.getConfigurationPropertyFiles(configuration);
  }

  public getInstalledFilterPlugins(pluginInstalled?: boolean) {
    this.filterService.getInstalledFilterPlugins().subscribe(
      (data: any) => {
        this.plugins = sortBy(data.plugins, p => {
          return p.name.toLowerCase();
        });
        if (pluginInstalled) {
          this.serviceForm.controls.plugin.disable();
          this.serviceForm.controls.plugin.clearValidators();
          this.serviceForm.controls.plugin.updateValueAndValidity();
          this.moveNext(pluginInstalled);
        }
      },
      (error) => {
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  public getCategories(): void {
    this.configurationService.getCategories().
      subscribe(
        (data: any) => {
          this.categories = data.categories;
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText, true);
          }
        }
      );
  }

  filterSelectionChanged(event: any) {
    if (event !== undefined) {
      this.serviceForm.controls.plugin.disable();
      this.serviceForm.controls.pluginToInstall.enable();
    } else {
      this.serviceForm.controls.plugin.enable();
      this.serviceForm.controls.pluginToInstall.reset();
      this.serviceForm.controls.pluginToInstall.clearValidators();
      this.serviceForm.controls.pluginToInstall.updateValueAndValidity();
    }
  }

  /**
   * Open readthedocs.io documentation of filter plugins
   * @param selectedPlugin Selected filter plugin
   *
   */
  goToLink(selectedPlugin: string) {
    const pluginInfo = {
      name: selectedPlugin,
      type: 'filter'
    };
    this.docService.goToPluginLink(pluginInfo);
  }
}
