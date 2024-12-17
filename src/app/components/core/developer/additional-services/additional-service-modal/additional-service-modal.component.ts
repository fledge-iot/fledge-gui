import { Component, ViewChild, HostListener, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ProgressBarService, AlertService, ServicesApiService, SchedulesService,
  ConfigurationService, RolesService, ConfigurationControlService,
  FileUploaderService, SharedService
} from '../../../../../services';
import { DialogService } from '../../../../common/confirmation-dialog/dialog.service';

import { AlertDialogComponent } from '../../../../common/alert-dialog/alert-dialog.component';
import { isEmpty, cloneDeep } from 'lodash';
import { concatMap, delayWhen, retryWhen, take, tap, map } from 'rxjs/operators';
import { BehaviorSubject, of, Subscription, throwError, timer } from 'rxjs';
import { DocService } from '../../../../../services/doc.service';
import { ConfigurationGroupComponent } from '../../../configuration-manager/configuration-group/configuration-group.component';
import { QUOTATION_VALIDATION_PATTERN } from '../../../../../utils';
import { Service, Schedule } from '../../../../../models';
import { AdditionalServicesUtils } from '../additional-services-utils.service';

@Component({
  selector: 'app-additional-service-modal',
  templateUrl: './additional-service-modal.component.html',
  styleUrls: ['./additional-service-modal.component.css']
})
export class AdditionalServiceModalComponent implements OnInit, OnDestroy {
  category: any;
  serviceName = '';
  btnText = 'Add';
  showDeleteBtn = true;
  isServiceEnabled = false;

  serviceInstallationState = false;

  increment = 1;
  maxRetry = 15;
  initialDelay = 1000;
  state$ = new BehaviorSubject<any>(null);
  service = <Service>{};

  // service info object passed by another component while redirecting to additional services modal
  serviceInfo = {
    added: false, type: '', isEnabled: false, schedule_process: '', process: '', package: '',
    isInstalled: false
  };

  @ViewChild('fg') form: NgForm;
  @ViewChild(AlertDialogComponent, { static: true }) child: AlertDialogComponent;
  @ViewChild('configComponent') configComponent: ConfigurationGroupComponent;

  changedConfig: any;
  categoryCopy: { name: string; config: Object; };
  advancedConfiguration = [];
  validForm = true;
  QUOTATION_VALIDATION_PATTERN = QUOTATION_VALIDATION_PATTERN;
  pollingScheduleID: string;
  fromListPage: boolean;
  public reenableButton = new EventEmitter<boolean>(false);

  private paramsSubscription: Subscription;

  constructor(
    public activatedRoute: ActivatedRoute,
    private router: Router,
    public fb: FormBuilder,
    public ngProgress: ProgressBarService,
    private configService: ConfigurationService,
    public schedulesService: SchedulesService,
    public servicesApiService: ServicesApiService,
    public sharedService: SharedService,
    public alertService: AlertService,
    private docService: DocService,
    private dialogService: DialogService,
    private fileUploaderService: FileUploaderService,
    private configurationControlService: ConfigurationControlService,
    private additionalServicesUtils: AdditionalServicesUtils,
    public rolesService: RolesService) { }

  ngOnInit() {
    this.paramsSubscription = this.activatedRoute.paramMap
      .pipe(map(() => window.history.state)).subscribe(service => {
        if (service?.process) {
          this.fromListPage = service.fromListPage;

          const openedServiceModal = this.additionalServicesUtils.allExpectedServices.find(es => es.process === service.process);
          service.type = openedServiceModal.type;
          service.schedule_process = openedServiceModal.schedule_process;
          service.package = openedServiceModal.package;

          this.getServiceInfo(service, service?.pollingScheduleID);
          setTimeout(() => {
            this.toggleModal(true);
          }, 0);
        } else {
          // if user navigates without passing 'service' object
          this.router.navigate(['/developer/options/additional-services']);
        }
      })
  }

  refreshService() {
    this.getSchedule(true);
    this.getCategory();
  }

  getServiceInfo(serviceInfo, pollingScheduleID) {
    this.serviceName = serviceInfo.name ? serviceInfo.name : '';
    this.serviceInfo = serviceInfo;
    this.isServiceEnabled = serviceInfo.isEnabled;

    if (pollingScheduleID) {
      this.pollingScheduleID = pollingScheduleID;
    } else if (this.serviceInfo.added && this.serviceInfo.type === 'Management' && this.isServiceEnabled) {
      // to get polling schedule ID
      this.getSchedule();
    }

    this.btnText = 'Add';
    if (this.serviceInfo.added) {
      this.showDeleteBtn = true;
      this.btnText = 'Save';
      this.getCategory();
    }
    if (this.serviceInfo.type && this.serviceName) {
      this.getServiceByType();
    }
  }

  public getSchedule(refresh = false) {
    this.schedulesService.getSchedules().
      subscribe((data: Schedule) => {
        if (refresh) {
          const schedule = data['schedules'].find(s => s.processName === this.serviceInfo.schedule_process);
          this.isServiceEnabled = this.serviceInfo.isEnabled = schedule['enabled'];
          this.serviceInfo.isEnabled = this.isServiceEnabled;
        }
        if (this.serviceInfo.added && this.serviceInfo.type === 'Management' && this.isServiceEnabled) {
          this.pollingScheduleID = data['schedules'].find(s => s.processName === 'manage')?.id;
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

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    if (!this.serviceInstallationState) {
      this.toggleModal(false);
      this.additionalServicesUtils.navToAdditionalServicePage(this.fromListPage, this.serviceInfo.process);
    }
  }

  public toggleModal(isOpen: boolean) {
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
      serviceModal.classList.remove('is-active');
      this.category = '';
      this.service = <Service>{};
    }
  }

  public getServiceByType() {
    this.ngProgress.start();
    this.servicesApiService.getServiceByType(this.serviceInfo.type)
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
      type: this.serviceInfo.type.toLowerCase(),
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
          this.serviceInfo.added = true;
          this.btnText = 'Save';
          this.toggleModal(false);
          this.getUpdatedState('addService', payload.name, formValues.enabled);
        },
        (error) => {
          this.ngProgress.done();
          this.toggleModal(false);
          this.additionalServicesUtils.navToAdditionalServicePage(this.fromListPage, this.serviceInfo.process);
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
      name: this.serviceInfo.package,
      version: ''
    };

    /** request started */
    this.ngProgress.start();
    this.alertService.activityMessage('Installing ' + this.serviceInfo.type + ' service...', true);
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
            this.additionalServicesUtils.navToAdditionalServicePage(this.fromListPage, this.serviceInfo.process);
            this.alertService.error('Failed to install from repository');
          } else {
            let errorText = error.statusText;
            if (typeof error.error.link === 'string') {
              errorText += ` <a>${error.error.link}</a>`;
            }
            this.additionalServicesUtils.navToAdditionalServicePage(this.fromListPage, this.serviceInfo.process);
            this.alertService.error(errorText);
          }
        });
  }

  public getCategory(): void {
    this.ngProgress.start();
    this.configService.getCategory(this.serviceName).
      subscribe(
        (data) => {
          this.category = { name: this.serviceName, config: data };
          this.categoryCopy = cloneDeep({ name: this.serviceName, config: data });
          this.ngProgress.done();
        },
        error => {
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
    this.getUpdatedState(true);
  }

  getUpdatedState(status, name = null, isEnabled = null) {
    let i = 1;
    const serviceName = name ? name : this.serviceName;
    this.schedulesService.getSchedules()
      .pipe(
        take(1),
        // checking the response object for schedule  
        tap((response: any) => {
          const schedule = response['schedules'].find(s => s.name === serviceName);
          // if param value is 'addService' then, check if schedule is not available yet
          // throw an error to re-fetch:
          if (status === 'addService') {
            if (!schedule) {
              i++;
              throw response;
            }
            return;
          } else {
            // if schedule.enabled !== status then
            // throw an error to re-fetch:
            if (schedule.enabled !== status) {
              i++;
              throw response;
            }
          }
        }),
        retryWhen(result =>
          result.pipe(
            // only if a server returned an error, stop trying and pass the error down
            tap(scheduleStatus => {
              if (scheduleStatus.error) {
                this.ngProgress.done();
                this.toggleModal(false);
                this.reenableButton.emit(false);
                this.additionalServicesUtils.navToAdditionalServicePage(this.fromListPage, this.serviceInfo.process);
                throw scheduleStatus.error;
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
                this.additionalServicesUtils.navToAdditionalServicePage(this.fromListPage, this.serviceInfo.process);
                return;
              }
              return of(o);
            }),
          ))
      ).subscribe(() => {
        if (typeof (status) === 'boolean') {
          // Due to delay in getting updated state (enable/disable), check the response of / service API too as per updated state before navigating on another page
          this.getUpdatedServiceState(serviceName, status, isEnabled);
        } else {
          this.ngProgress.done();
          let serviceDetail = { name: '', added: false, isEnabled: false, isInstalled: false, process: this.serviceInfo.process };
          serviceDetail.isEnabled = isEnabled !== null ? isEnabled : status;
          serviceDetail.isInstalled = true;
          serviceDetail.added = this.serviceInfo.added;
          serviceDetail.name = serviceName;
          serviceDetail.process = this.serviceInfo.process;

          // set updated service details to get on different service pages
          this.sharedService.installedServicePkgs.next({ installed: serviceDetail });
          this.toggleModal(false);
          this.reenableButton.emit(false);
          this.additionalServicesUtils.navToAdditionalServicePage(this.fromListPage, this.serviceInfo.process, true);
        }
      });
  }

  getUpdatedServiceState(serviceName, status, isEnabled) {
    let i = 1;
    this.servicesApiService.getAllServices()
      .pipe(
        take(1),
        // checking the response object for service  
        tap((response: any) => {
          const service = response.services.find((svc: any) => {
            if (svc.type === this.serviceInfo.type) {
              return svc;
            }
          });
          // if param value is 'addService' then, check if service is not available yet
          // throw an error to re-fetch:
          if (status === 'addService') {
            if (!service) {
              i++;
              throw response;
            }
            return;
          } else {
            // if service.status !== status then
            // throw an error to re-fetch:
            let expectedStatus = status ? 'running' : 'shutdown';
            if (service.status !== expectedStatus) {
              i++;
              throw response;
            }
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
                this.additionalServicesUtils.navToAdditionalServicePage(this.fromListPage, this.serviceInfo.process);
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
                this.additionalServicesUtils.navToAdditionalServicePage(this.fromListPage, this.serviceInfo.process);
                return;
              }
              return of(o);
            }),
          ))
      ).subscribe(() => {
        this.ngProgress.done();
        let serviceDetail = { name: '', added: false, isEnabled: false, isInstalled: false, process: this.serviceInfo.process };
        serviceDetail.isEnabled = isEnabled !== null ? isEnabled : status;
        serviceDetail.isInstalled = true;
        serviceDetail.added = this.serviceInfo.added;
        serviceDetail.name = serviceName;
        serviceDetail.process = this.serviceInfo.process;

        // set updated service details to get on different service pages
        this.sharedService.installedServicePkgs.next({ installed: serviceDetail });
        this.toggleModal(false);
        this.reenableButton.emit(false);
        this.additionalServicesUtils.navToAdditionalServicePage(this.fromListPage, this.serviceInfo.process, true);
      });
  }

  disableService() {
    this.additionalServicesUtils.disableService(this.serviceName);
    this.getUpdatedState(false);
  }

  deleteService(serviceName: string) {
    this.ngProgress.start();
    this.servicesApiService.deleteService(serviceName).subscribe(
      (data: any) => {
        this.ngProgress.done();

        // set updated service details to get on different service pages
        const serviceDetail = { name: '', added: false, isEnabled: false, isInstalled: true, process: this.serviceInfo.process };
        this.sharedService.installedServicePkgs.next({ installed: serviceDetail });
        this.additionalServicesUtils.navToAdditionalServicePage(this.fromListPage, this.serviceInfo.process, true);

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
    if (!this.serviceInfo.isInstalled) {
      this.installService();
    } else {
      this.addService(false);
    }
  }

  stateUpdate() {
    this.state$.next(this.form.value);
    if (!this.serviceInfo.added) {
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
    if (!this.serviceInfo.added && !this.form.controls['serviceName'].value) {
      this.alertService.error('Missing service name');
      return;
    }

    // If form value is not changed then return
    if (this.serviceInfo.added && (this.isServiceEnabled === this.form.controls['enabled'].value) && isEmpty(this.changedConfig) && isEmpty(this.advancedConfiguration)) {
      this.toggleModal(false);
      this.additionalServicesUtils.navToAdditionalServicePage(this.fromListPage, this.serviceInfo.process);
      this.alertService.error('Nothing to save');
      return;
    }
    this.stateUpdate();

    if (!isEmpty(this.changedConfig) && this.categoryCopy?.name) {
      this.updateConfiguration(this.categoryCopy?.name, this.changedConfig);
      this.toggleModal(false);
      this.additionalServicesUtils.navToAdditionalServicePage(this.fromListPage, this.serviceInfo.process);
    }
    if (!isEmpty(this.advancedConfiguration)) {
      this.advancedConfiguration.forEach(element => {
        this.updateConfiguration(element.key, element.config);
      });
      this.toggleModal(false);
      this.additionalServicesUtils.navToAdditionalServicePage(this.fromListPage, this.serviceInfo.process);
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
    this.additionalServicesUtils.navToAdditionalServicePage(this.fromListPage, this.serviceInfo.process);
  }

  goToLink() {
    // ReadTheDoc is not available for Bucket and Management Services
    // TODO: FOGL-5650/FOGL-6589
    if (this.serviceInfo.process === 'notification') {
      this.docService.goToServiceDocLink('configuring-the-service', 'fledge-service-' + this.serviceInfo.process);
    }
    if (this.serviceInfo.process === 'dispatcher') {
      this.docService.goToSetPointControlDocLink('control-dispatcher-service');
    }
  }

  ngOnDestroy() {
    this.paramsSubscription.unsubscribe();
  }
}
