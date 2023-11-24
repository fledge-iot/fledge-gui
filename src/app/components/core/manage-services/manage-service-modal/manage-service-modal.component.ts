import { Component, OnChanges, Input, SimpleChanges, ViewChild, HostListener, EventEmitter } from '@angular/core';
import { FormBuilder, NgForm } from '@angular/forms';
import {
  ProgressBarService, AlertService, ServicesApiService, SchedulesService,
  ConfigurationService,
  RolesService,
  ConfigurationControlService,
  FileUploaderService
} from '../../../../services';

import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';
import { isEmpty, cloneDeep } from 'lodash';
import { concatMap, delayWhen, retryWhen, take, tap } from 'rxjs/operators';
import { BehaviorSubject, of, throwError, timer } from 'rxjs';
import { DocService } from '../../../../services/doc.service';
import { Router } from '@angular/router';
import { ConfigurationGroupComponent } from '../../configuration-manager/configuration-group/configuration-group.component';
import {QUOTATION_VALIDATION_PATTERN} from '../../../../utils';

@Component({
  selector: 'app-manage-service-modal',
  templateUrl: './manage-service-modal.component.html',
  styleUrls: ['./manage-service-modal.component.css']
})
export class ManageServiceModalComponent implements OnChanges {
  enabled: Boolean;
  category: any;
  isServiceAvailable = false;
  isServiceEnabled = false;
  serviceName = '';
  availableServices = [];
  servicePackageName = 'fledge-service-notification';
  btnText = 'Add';
  showDeleteBtn = true;
  public serviceRecord;

  pluginInstallationState = false;

  increment = 1;
  maxRetry = 15;
  initialDelay = 1000;
  state$ = new BehaviorSubject<any>(null);

  service;
  @Input() serviceData: {
    serviceAvailable: boolean, serviceEnabled: boolean,
    serviceName: string
  };
  @ViewChild('fg') form: NgForm;
  @ViewChild(AlertDialogComponent, { static: true }) child: AlertDialogComponent;
  @ViewChild('configComponent') configComponent: ConfigurationGroupComponent;

  changedConfig: any;
  categoryCopy: { name: string; config: Object; };
  advancedConfiguration = [];
  validForm = true;
  QUOTATION_VALIDATION_PATTERN = QUOTATION_VALIDATION_PATTERN;

  public reenableButton = new EventEmitter<boolean>(false);

  constructor(
    private router: Router,
    public fb: FormBuilder,
    public ngProgress: ProgressBarService,
    private configService: ConfigurationService,
    public schedulesService: SchedulesService,
    public servicesApiService: ServicesApiService,
    public alertService: AlertService,
    private docService: DocService,
    private fileUploaderService: FileUploaderService,
    private configurationControlService: ConfigurationControlService,
    public rolesService: RolesService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['serviceData']) {
      this.serviceName = this.serviceData.serviceName;
      this.isServiceEnabled = this.serviceData.serviceEnabled;
      this.isServiceAvailable = this.serviceData.serviceAvailable;
    }
    this.enabled = this.isServiceEnabled;
    this.btnText = 'Add';
    if (this.isServiceAvailable) {
      this.showDeleteBtn = true;
      this.btnText = 'Save';
      this.getCategory();
    }
  }

  ngOnInit() {
    this.getService();
  }

  refreshPageData() {
    this.changedConfig = null;
    this.validForm = true;
    this.advancedConfiguration = [];
    this.getCategory();
    if (this.configComponent) {
      this.configComponent?.updateCategroyConfig(this.categoryCopy.config);
      this.configComponent.getChildConfigData();
    }
    this.enabled = this.isServiceEnabled;
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    if (!this.pluginInstallationState) {
      this.toggleModal(false);
    }
  }

  public toggleModal(isOpen: Boolean) {
    this.pluginInstallationState = false;
    this.reenableButton.emit(false);
    const serviceModal = <HTMLDivElement>document.getElementById('manage-service-modal');
    if (serviceModal) {
      if (isOpen) {
        this.changedConfig = null;
        this.advancedConfiguration = [];
        if (this.form.controls['serviceName'] !== undefined) {
          this.form.controls['serviceName'].markAsPristine();
          this.form.controls['enabled'].markAsUntouched();
          this.form.controls['serviceName'].reset();
        }
        serviceModal.classList.add('is-active');
        return;
      }
      serviceModal.classList.remove('is-active');
      this.category = '';
    }
  }

  public getService() {
    this.ngProgress.start();
    this.servicesApiService.getServiceByType('Notification')
      .subscribe((res: any) => {
        this.ngProgress.done();
        this.service = res.services[0];
      },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          }
        });
  }

  addService(installationState = false) {
    const formValues = this.state$.getValue() || {};
    const name = formValues.serviceName;
    const payload = {
      name: name,
      type: 'notification',
      enabled: formValues.enabled
    };
    /** request start */
    if (!installationState) {
      this.ngProgress.start();
    }
    this.servicesApiService.addService(payload)
      .subscribe(
        () => {
          this.ngProgress.done();
          this.alertService.success('Service added successfully.', true);
          this.isServiceAvailable = true;
          this.btnText = 'Save';
          this.toggleModal(false);
          // setTimeout(() => {
          //   this.notificationService.notifyServiceEmitter.next({ isAddDeleteAction: true });
          // }, 1000);
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

  monitorServiceInstallationStatus(data: any, pluginName: string) {
    this.servicesApiService.monitorPluginInstallationStatus(data.statusLink)
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
                this.pluginInstallationState = false;
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
        this.pluginInstallationState = false;
        this.addService(true);
      });
  }


  /**
   * Open delete modal
   */
  openDeleteModal(name: string) {
    this.serviceRecord = {
      name: name,
      message: 'Deleting this service can not be undone. Continue',
      key: 'deleteService'
    };
    // call child component method to toggle modal
    this.child.toggleModal(true, '#manage-service-modal ');
  }

  public async getInstalledServicesList() {
    /** request start */
    this.ngProgress.start();
    await this.servicesApiService.getInstalledServices().
      then(data => {
        /** request done */
        this.ngProgress.done();
        this.availableServices = data['services'];
      })
      .catch(error => {
        /** request done */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  installService() {
    this.pluginInstallationState = true;
    const servicePayload = {
      format: 'repository',
      name: this.servicePackageName,
      version: ''
    };

    /** request started */
    this.ngProgress.start();
    this.alertService.activityMessage('Installing service...', true);
    this.servicesApiService.installService(servicePayload).
      subscribe(
        (data: any) => {
          this.monitorServiceInstallationStatus(data, servicePayload.name);
        },
        error => {
          /** request done */
          this.pluginInstallationState = false;
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else if (error.status === 500) {
            this.alertService.error('Failed to install from repository');
          } else {
            let errorText = error.statusText;
            if (typeof error.error.link === 'string') {
              errorText += ` <a>${error.error.link}</a>`;
            }
            this.alertService.error(errorText);
          }
        });
  }

  public getCategory(): void {
    /** request started */
    this.ngProgress.start();
    this.configService.getCategory(this.serviceName).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            this.category = { name: this.serviceName, config: data };
            this.categoryCopy = cloneDeep({ name: this.serviceName, config: data });
          }
          /** request completed */
          this.ngProgress.done();
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else if (error.status === 404) {   // TODO: FOGL-3499
            this.showDeleteBtn = false;
          } else {
            this.alertService.error(error.statusText, true);
          }
        }
      );
  }

  enableService(name = null) {
    let serviceName = this.serviceName;
    if (name != null) {
      serviceName = name;
    }
    /** request started */
    this.ngProgress.start();
    this.schedulesService.enableScheduleByName(serviceName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data['message'], true);
          this.isServiceEnabled = true;
          this.service.notifyServiceEmitter.next({ isEnabled: this.isServiceEnabled });
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

  disableService() {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.disableScheduleByName(this.serviceName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data['message'], true);
          this.isServiceEnabled = false;
          // this.notificationService.notifyServiceEmitter.next({ isEnabled: this.isNotificationServiceEnabled });
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

  deleteService(name: string) {
    this.ngProgress.start();
    this.service.deleteService(name)
      .subscribe(
        (data: any) => {
          this.ngProgress.done();
          this.alertService.success(data['result'], true);
          this.service.notifyServiceEmitter.next({ isAddDeleteAction: true });
          this.toggleModal(false);
          this.form.reset();
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public async addServiceEvent() {
    await this.getInstalledServicesList();
    if (!this.availableServices.includes('notification')) {
      this.installService();
    } else {
      this.addService(false);
    }
  }

  stateUpdate() {
    this.state$.next(this.form.value);
    if (!this.isServiceAvailable) {
      this.addServiceEvent();
    } else {
      if (this.isServiceEnabled && !this.form.controls['enabled'].value) {
        this.disableService();
      }
      if (!this.isServiceEnabled && this.form.controls['enabled'].value) {
        this.enableService();
      }
    }
  }

  getChangedConfig(changedConfiguration: any) {
    this.changedConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, this.categoryCopy);
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
   * To upload script files of a configuration property
   * @param categoryName name of the configuration category
   * @param files : Scripts array to uplaod
   */
  public uploadScript(categoryName: string, files: any[]) {
    this.fileUploaderService.uploadConfigurationScript(categoryName, files);
  }

  save() {
    this.stateUpdate();
    if (!isEmpty(this.changedConfig) && this.categoryCopy?.name) {
      this.updateConfiguration(this.categoryCopy?.name, this.changedConfig);
    }
    if (!isEmpty(this.advancedConfiguration)) {
      this.advancedConfiguration.forEach(element => {
        this.updateConfiguration(element.key, element.config);
      });
    }

    this.toggleModal(false);
  }

  /**
   * Update configuration
   * @param categoryName Name of the cateogry
   * @param configuration category updated configuration
   */
  updateConfiguration(categoryName: string, configuration: any) {
    const files = this.getScriptFilesToUpload(configuration);
    if (files.length > 0) {
      this.uploadScript(categoryName, files);
    }

    if (isEmpty(configuration)) {
      this.reenableButton.emit(false);
      return;
    }

    this.configService.
      updateBulkConfiguration(categoryName, configuration)
      .subscribe(() => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertService.success('Configuration updated successfully.', true);
      },
        (error) => {
          this.ngProgress.done();
          this.reenableButton.emit(false);
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  /**
  * Get edited service advance configuration
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

  navToSyslogs(name: string) {
    this.router.navigate(['logs/syslog'], { queryParams: { source: name } });
  }

  goToLink() {
    const urlSlug = 'configuring-the-service';
    // this.docService.goToDocLink(urlSlug);
  }
}
