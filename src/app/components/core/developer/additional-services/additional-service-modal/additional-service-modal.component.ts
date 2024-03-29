import { Component, ViewChild, Output, HostListener, EventEmitter } from '@angular/core';
import { FormBuilder, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ProgressBarService, AlertService, ServicesApiService, SchedulesService,
  ConfigurationService,
  RolesService,
  ConfigurationControlService,
  FileUploaderService
} from '../../../../../services';
import { DialogService } from '../../../../common/confirmation-dialog/dialog.service';

import { AlertDialogComponent } from '../../../../common/alert-dialog/alert-dialog.component';
import { isEmpty, cloneDeep } from 'lodash';
import { concatMap, delayWhen, retryWhen, take, tap, map } from 'rxjs/operators';
import { BehaviorSubject, of, throwError, timer } from 'rxjs';
import { DocService } from '../../../../../services/doc.service';
import { ConfigurationGroupComponent } from '../../../configuration-manager/configuration-group/configuration-group.component';
import { QUOTATION_VALIDATION_PATTERN } from '../../../../../utils';
import { Service } from '../../../../../models';
import { AdditionalServicesUtils } from '../additional-services-utils.service';

@Component({
  selector: 'app-additional-service-modal',
  templateUrl: './additional-service-modal.component.html',
  styleUrls: ['./additional-service-modal.component.css']
})
export class AdditionalServiceModalComponent {
  category: any;
  isServiceAvailable = false;
  isServiceEnabled = false;
  serviceProcessName = '';
  serviceType = '';
  serviceName = '';
  isInstalled: boolean;
  packageName = '';
  btnText = 'Add';
  showDeleteBtn = true;

  serviceInstallationState = false;

  increment = 1;
  maxRetry = 15;
  initialDelay = 1000;
  state$ = new BehaviorSubject<any>(null);
  service = <Service>{};

  @ViewChild('fg') form: NgForm;
  @ViewChild(AlertDialogComponent, { static: true }) child: AlertDialogComponent;
  @ViewChild('configComponent') configComponent: ConfigurationGroupComponent;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  changedConfig: any;
  categoryCopy: { name: string; config: Object; };
  advancedConfiguration = [];
  validForm = true;
  QUOTATION_VALIDATION_PATTERN = QUOTATION_VALIDATION_PATTERN;
  pollingScheduleID: string;
  navigateFromParent: string;
  fromNavbar: boolean;
  public reenableButton = new EventEmitter<boolean>(false);

  constructor(
    public activatedRoute: ActivatedRoute,
    private router: Router,
    public fb: FormBuilder,
    public ngProgress: ProgressBarService,
    private configService: ConfigurationService,
    public schedulesService: SchedulesService,
    public servicesApiService: ServicesApiService,
    public alertService: AlertService,
    private docService: DocService,
    private dialogService: DialogService,
    private fileUploaderService: FileUploaderService,
    private configurationControlService: ConfigurationControlService,
    private additionalServicesUtils: AdditionalServicesUtils,
    public rolesService: RolesService) {
      this.activatedRoute.paramMap
      .pipe(map(() => window.history.state)).subscribe(res=>{
          if (res?.name) {
            this.fromNavbar = true;
            res['added'] = true;
            res['isInstalled'] = true;
            this.getServiceInfo(res, res?.pollingScheduleID);
            setTimeout(() => {
              this.toggleModal(true);
            }, 0);
          }                          
       })
    }

  ngOnInit() { }

  getServiceInfo(serviceInfo, pollingScheduleID, from = null) {
    this.navigateFromParent = from;
    this.serviceName = serviceInfo.name ? serviceInfo.name : '';
    this.isServiceEnabled = serviceInfo.isEnabled;
    this.isServiceAvailable = serviceInfo.added;
    this.serviceProcessName = serviceInfo.process;
    this.serviceType = serviceInfo.type;
    this.packageName = serviceInfo.package;
    this.isInstalled =  serviceInfo.isInstalled;  
    if (pollingScheduleID) {
      this.pollingScheduleID = pollingScheduleID;
    }
    this.btnText = 'Add';
    if (this.isServiceAvailable) {
      this.showDeleteBtn = true;
      this.btnText = 'Save';
      this.getCategory();
    }
    if (this.serviceType) {
      this.getServiceByType();
    }
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    if (!this.serviceInstallationState) {
      this.toggleModal(false, false);
      this.additionalServicesUtils.navToAdditionalServicePage(this.fromNavbar, this.serviceProcessName);
    }
  }

  public toggleModal(isOpen: Boolean, eventToHandle = true) {
    this.serviceInstallationState = false;
    this.reenableButton.emit(false);
    const serviceModal = <HTMLDivElement>document.getElementById('additional-service-modal');
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
      this.notify.emit(eventToHandle);
      serviceModal.classList.remove('is-active');
      this.category = '';
      this.service = <Service>{};
    }
  }

  public getServiceByType() {
    this.ngProgress.start();
    this.servicesApiService.getServiceByType(this.serviceType)
      .subscribe((res: Service) => {
        this.ngProgress.done();
        this.service = res['services'][0];
      },
        (error) => {
          this.ngProgress.done();
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
      type: this.serviceType.toLowerCase(),
      enabled: formValues.enabled
    };
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
          this.additionalServicesUtils.navToAdditionalServicePage(this.fromNavbar, this.serviceProcessName);
        },
        (error) => {
          this.ngProgress.done();
          this.toggleModal(false);
          this.additionalServicesUtils.navToAdditionalServicePage(this.fromNavbar, this.serviceProcessName);
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  pollServiceInstallationStatus(data: any, pluginName: string) {
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
                this.serviceInstallationState = false;
                this.ngProgress.done();
                this.toggleModal(false);
                this.alertService.closeMessage();
                // tslint:disable-next-line: max-line-length
                return throwError(`Failed to get expected results in ${this.maxRetry} attempts, tried with incremental time delay starting with 2s, for installing plugin ${pluginName}`);
              }
              return of(o);
            }),
          ))
      ).subscribe(() => {
        this.ngProgress.done();
        this.serviceInstallationState = false;
        this.addService(true);
      });
  }

  /**
   * Open delete modal
   */
  openDeleteModal(id: string) {
    this.dialogService.open(id);
  }

  closeDeleteModal(id: string) {
    this.dialogService.close(id);
  }

  installService() {
    this.serviceInstallationState = true;
    const servicePayload = {
      format: 'repository',
      name: this.packageName,
      version: ''
    };

    /** request started */
    this.ngProgress.start();
    this.alertService.activityMessage('Installing '+ this.serviceType +' service...', true);
    this.servicesApiService.installService(servicePayload).
      subscribe(
        (data: any) => {
          this.pollServiceInstallationStatus(data, servicePayload.name);
        },
        error => {
          /** request done */
          this.serviceInstallationState = false;
          this.toggleModal(false);
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
          this.category = { name: this.serviceName, config: data };
          this.categoryCopy = cloneDeep({ name: this.serviceName, config: data });
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
    this.additionalServicesUtils.enableService(serviceName);
    // enabling service takes time to get the updated state from API
    this.getUpdatedState('running');
  }

  getUpdatedState(status) {
    let i = 1;
    this.servicesApiService.getServiceByType(this.serviceType)
      .pipe(
        take(1),
        // checking the response object for service.
        // if service.status !== 'running'/'shutdown' then
        // throw an error to re-fetch:
        tap((response: any) => {
          if (response['services'][0].status !== status) {
            i++;
            throw response;
          }
        }),
        retryWhen(result =>
          result.pipe(
            // only if a server returned an error, stop trying and pass the error down
            tap(serviceStatus => {
              if (serviceStatus.error) {
                this.ngProgress.done();
                this.toggleModal(false);
                this.reenableButton.emit(false);
                this.additionalServicesUtils.navToAdditionalServicePage(this.fromNavbar, this.serviceProcessName);
                throw serviceStatus.error;
              }
            }),
            delayWhen(() => {
              const delay = i * this.initialDelay;
              console.log(new Date().toLocaleString(), `retrying after ${delay} msec...`);             
              return timer(delay);
            }), // delay between api calls
            // Set the number of attempts.
            take(3),
            // Throw error after exceed number of attempts
            concatMap(o => {
              if (i > 3) {
                this.ngProgress.done();
                this.toggleModal(false);
                this.reenableButton.emit(false);   
                this.additionalServicesUtils.navToAdditionalServicePage(this.fromNavbar, this.serviceProcessName);
                return;
              }
              return of(o);
            }),
          ))
      ).subscribe(() => {
        this.ngProgress.done();
        this.toggleModal(false);
        this.reenableButton.emit(false);
        this.additionalServicesUtils.navToAdditionalServicePage(this.fromNavbar, this.serviceProcessName);
      });
  }

  disableService() {
    this.additionalServicesUtils.disableService(this.serviceName, this.fromNavbar, this.serviceProcessName);
    this.getUpdatedState('shutdown');
  }

  deleteService(serviceName: string) {
    this.ngProgress.start();
    this.servicesApiService.deleteService(serviceName).subscribe(
      (data: any) => {
        this.ngProgress.done();
        this.navToAdditionalService();
        this.alertService.success(data["result"], true);
        this.closeDeleteModal("dialog-delete-confirmation");
        this.toggleModal(false);
        this.reenableButton.emit(false);
      },
      (error) => {
        this.ngProgress.done();
        this.closeDeleteModal("dialog-delete-confirmation");
        this.reenableButton.emit(false);
        if (error.status === 0) {
            console.log("service down ", error);
        } else {
            this.alertService.error(error.statusText);
        }
      }
    );
  }

  public addServiceEvent() {
    if (!this.isInstalled) {
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
      if (!this.form.controls['enabled'].value) {
        this.disableService();
      }
      if (this.form.controls['enabled'].value) {
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
    if (!this.isServiceAvailable && !this.form.controls['serviceName'].value) {
      this.alertService.error('Missing service name');
      return;
    }
    this.stateUpdate();
    if (!isEmpty(this.changedConfig) && this.categoryCopy?.name) {
      this.updateConfiguration(this.categoryCopy?.name, this.changedConfig);
      this.toggleModal(false);
      this.additionalServicesUtils.navToAdditionalServicePage(this.fromNavbar, this.serviceProcessName);
    }
    if (!isEmpty(this.advancedConfiguration)) {
      this.advancedConfiguration.forEach(element => {
        this.updateConfiguration(element.key, element.config);
      });
      this.toggleModal(false);
      this.additionalServicesUtils.navToAdditionalServicePage(this.fromNavbar, this.serviceProcessName);
    }
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

  navToAdditionalService() {
    this.additionalServicesUtils.navToAdditionalServicePage(this.fromNavbar, this.serviceProcessName);
  }

  goToLink() {
    // ReadTheDoc is not available for Bucket and Management Services
    // TODO: FOGL-5650/FOGL-6589
    if (this.serviceProcessName === 'notification') {
      this.docService.goToServiceDocLink('configuring-the-service', 'fledge-service-' + this.serviceProcessName);
    }
    if (this.serviceProcessName === 'dispatcher') {
      this.docService.goToSetPointControlDocLink('control-dispatcher-service');
    }
    return;
  }
}
