import { Component, OnChanges, Input, SimpleChanges, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, NgForm } from '@angular/forms';
import {
  ProgressBarService, NotificationsService, AlertService, ServicesApiService, SchedulesService,
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
import {REGEX_PATTERN} from '../../../../utils';

@Component({
  selector: 'app-notification-service-modal',
  templateUrl: './notification-service-modal.component.html',
  styleUrls: ['./notification-service-modal.component.css']
})
export class NotificationServiceModalComponent implements OnChanges {
  enabled: Boolean;
  category: any;
  isNotificationServiceAvailable = false;
  isNotificationServiceEnabled = false;
  notificationServiceName = '';
  availableServices = [];
  notificationServicePackageName = 'fledge-service-notification';
  btnText = 'Add';
  showDeleteBtn = true;
  public notificationServiceRecord;

  pluginInstallationState = false;

  increment = 1;
  maxRetry = 15;
  initialDelay = 1000;
  state$ = new BehaviorSubject<any>(null);

  service;
  @Input() notificationServiceData: {
    notificationServiceAvailable: boolean, notificationServiceEnabled: boolean,
    notificationServiceName: string
  };
  @ViewChild('fg') form: NgForm;
  @ViewChild(AlertDialogComponent, { static: true }) child: AlertDialogComponent;
  @ViewChild('configComponent') configComponent: ConfigurationGroupComponent;

  changedConfig: any;
  categoryCopy: { name: string; config: Object; };
  advancedConfiguration = [];
  validForm = true;
  REGEX_PATTERN = REGEX_PATTERN;

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
    private notificationService: NotificationsService,
    public rolesService: RolesService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['notificationServiceData']) {
      this.notificationServiceName = this.notificationServiceData.notificationServiceName;
      this.isNotificationServiceEnabled = this.notificationServiceData.notificationServiceEnabled;
      this.isNotificationServiceAvailable = this.notificationServiceData.notificationServiceAvailable;
    }
    this.enabled = this.isNotificationServiceEnabled;
    this.btnText = 'Add';
    if (this.isNotificationServiceAvailable) {
      this.showDeleteBtn = true;
      this.btnText = 'Save';
      this.getCategory();
    }
  }

  ngOnInit() {
    this.getNotificationService();
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
    this.enabled = this.isNotificationServiceEnabled;
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    if (!this.pluginInstallationState) {
      this.toggleModal(false);
    }
  }

  public toggleModal(isOpen: Boolean) {
    this.pluginInstallationState = false;
    const notificationServiceModal = <HTMLDivElement>document.getElementById('notification-service-modal');
    if (notificationServiceModal) {
      if (isOpen) {
        this.changedConfig = null;
        this.advancedConfiguration = [];
        if (this.form.controls['notificationServiceName'] !== undefined) {
          this.form.controls['notificationServiceName'].markAsPristine();
          this.form.controls['enabled'].markAsUntouched();
          this.form.controls['notificationServiceName'].reset();
        }
        notificationServiceModal.classList.add('is-active');
        return;
      }
      notificationServiceModal.classList.remove('is-active');
      this.category = '';
    }
  }

  public getNotificationService() {
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

  addNotificationService(installationState = false) {
    const formValues = this.state$.getValue() || {};
    const name = formValues.notificationServiceName;
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
          this.alertService.success('Notification service added successfully.', true);
          this.isNotificationServiceAvailable = true;
          this.btnText = 'Save';
          this.toggleModal(false);
          setTimeout(() => {
            this.notificationService.notifyServiceEmitter.next({ isAddDeleteAction: true });
          }, 1000);
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

  monitorNotificationServiceInstallationStatus(data: any, pluginName: string) {
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
        this.addNotificationService(true);
      });
  }


  /**
   * Open delete modal
   */
  openDeleteModal(name: string) {
    this.notificationServiceRecord = {
      name: name,
      message: 'Deleting this notification service can not be undone. Continue',
      key: 'deleteNotificationService'
    };
    // call child component method to toggle modal
    this.child.toggleModal(true, '#notification-service-modal ');
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

  installNotificationService() {
    this.pluginInstallationState = true;
    const servicePayload = {
      format: 'repository',
      name: this.notificationServicePackageName,
      version: ''
    };

    /** request started */
    this.ngProgress.start();
    this.alertService.activityMessage('Installing ' + 'notification service...', true);
    this.servicesApiService.installService(servicePayload).
      subscribe(
        (data: any) => {
          this.monitorNotificationServiceInstallationStatus(data, servicePayload.name);
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
    this.configService.getCategory(this.notificationServiceName).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            this.category = { name: this.notificationServiceName, config: data };
            this.categoryCopy = cloneDeep({ name: this.notificationServiceName, config: data });
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

  enableNotificationService(serviceName = null) {
    let notificationServiceName = this.notificationServiceName;
    if (serviceName != null) {
      notificationServiceName = serviceName;
    }
    /** request started */
    this.ngProgress.start();
    this.schedulesService.enableScheduleByName(notificationServiceName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data['message'], true);
          this.isNotificationServiceEnabled = true;
          this.notificationService.notifyServiceEmitter.next({ isEnabled: this.isNotificationServiceEnabled });
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

  disableNotificationService() {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.disableScheduleByName(this.notificationServiceName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data['message'], true);
          this.isNotificationServiceEnabled = false;
          this.notificationService.notifyServiceEmitter.next({ isEnabled: this.isNotificationServiceEnabled });
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

  deleteNotificationService(notificationName: string) {
    this.ngProgress.start();
    this.notificationService.deleteNotificationService(notificationName)
      .subscribe(
        (data: any) => {
          this.ngProgress.done();
          this.alertService.success(data['result'], true);
          this.notificationService.notifyServiceEmitter.next({ isAddDeleteAction: true });
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
      this.installNotificationService();
    } else {
      this.addNotificationService(false);
    }
  }

  notificationStateUpdate() {
    this.state$.next(this.form.value);
    if (!this.isNotificationServiceAvailable) {
      this.addServiceEvent();
    } else {
      if (this.isNotificationServiceEnabled && !this.form.controls['enabled'].value) {
        this.disableNotificationService();
      }
      if (!this.isNotificationServiceEnabled && this.form.controls['enabled'].value) {
        this.enableNotificationService();
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
    this.notificationStateUpdate();
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
      return;
    }

    this.configService.
      updateBulkConfiguration(categoryName, configuration)
      .subscribe(() => {
        this.ngProgress.done();
        this.alertService.success('Configuration updated successfully.', true);
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
    const urlSlug = 'configuring-the-notification-service';
    this.docService.goToNotificationDocLink(urlSlug);
  }
}
