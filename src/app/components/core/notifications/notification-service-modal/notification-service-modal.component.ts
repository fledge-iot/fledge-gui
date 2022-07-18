import { Component, OnChanges, Input, SimpleChanges, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, NgForm } from '@angular/forms';
import {
  ProgressBarService, NotificationsService, AlertService, ServicesApiService, SchedulesService,
  ConfigurationService
} from '../../../../services';

import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';
import { isEmpty } from 'lodash';
import { concatMap, delayWhen, retryWhen, take, tap } from 'rxjs/operators';
import { BehaviorSubject, of, throwError, timer } from 'rxjs';
import { DocService } from '../../../../services/doc.service';
import { Router } from '@angular/router';

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
  public categoryChildren = [];

  @Input() notificationServiceData: {
    notificationServiceAvailable: boolean, notificationServiceEnabled: boolean,
    notificationServiceName: string
  };
  @ViewChild('fg') form: NgForm;
  @ViewChild(AlertDialogComponent, { static: true }) child: AlertDialogComponent;

  constructor(
    private router: Router,
    public fb: FormBuilder,
    public ngProgress: ProgressBarService,
    private configService: ConfigurationService,
    public schedulesService: SchedulesService,
    public servicesApiService: ServicesApiService,
    public alertService: AlertService,
    private docService: DocService,
    private notificationService: NotificationsService) { }

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
      this.checkIfAdvanceConfig(this.notificationServiceName);
    }
  }

  ngOnInit() {
    this.getNotificationService();
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

  checkIfAdvanceConfig(categoryName) {
    this.configService.getCategoryConfigChildren(categoryName).
      subscribe(
        (data: any) => {
          this.categoryChildren = data.categories;
        },
        error => {
          console.log('error ', error);
        }
      );
  }

  public getNotificationService() {
    this.servicesApiService.getServiceByType('Notification')
      .subscribe((res: any) => {
        this.service = res.services[0];
      },
        (error) => {
          console.log('service down ', error);
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
    const categoryValues = [];
    this.configService.getCategory(this.notificationServiceName).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            categoryValues.push(data);
            this.category = { key: this.notificationServiceName, value: categoryValues };
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
          this.categoryChildren = [];
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

  saveChanges() {
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
      this.toggleModal(false);
    }
  }

  proxy() {
    if (!this.form.valid) {
      this.form.controls['notificationServiceName'].markAsTouched();
      return;
    }

    const cel = <HTMLCollection>document.getElementsByClassName('vci-proxy-children');
    for (const e of <any>cel) {
      e.click();
    }

    document.getElementById('hidden-save').click();
    this.notificationService.notifyServiceEmitter.next({ isConfigChanged: true });
  }

  navToSyslogs(name: string) {
    this.router.navigate(['syslog'], { queryParams: { source: name } });
  }

  goToLink() {
    const urlSlug = 'configuring-the-notification-service';
    this.docService.goToNotificationDocLink(urlSlug);
  }
}
