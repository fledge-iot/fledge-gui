import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { isEmpty, cloneDeep } from 'lodash';
import {
  ConfigurationService, AlertService,
  ProgressBarService,
  NotificationsService,
  RolesService,
  FileUploaderService,
  ConfigurationControlService
} from '../../../../services';
import { DocService } from '../../../../services/doc.service';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-notification-modal',
  templateUrl: './notification-modal.component.html',
  styleUrls: ['./notification-modal.component.css']
})
export class NotificationModalComponent implements OnInit {

  @Input() notification: { notification: any };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  category: any;
  ruleConfiguration: any;
  deliveryConfiguration: any;
  notificationRecord: any;

  rulePluginChangedConfig: any;
  deliveryPluginChangedConfig: any;
  notificationChangedConfig: any;

  // To hold API calls to execute
  apiCallsStack = [];

  categoryCopy: any;
  ruleConfigurationCopy: any;
  deliveryConfigurationCopy: any;

  public reenableButton = new EventEmitter<boolean>(false);
  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    private notificationService: NotificationsService,
    public ngProgress: ProgressBarService,
    private dialogService: DialogService,
    private docService: DocService,
    private fileUploaderService: FileUploaderService,
    private configurationControlService: ConfigurationControlService,
    public rolesService: RolesService) { }

  ngOnInit() { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    const alertModal = <HTMLDivElement>document.getElementById('modal-box');
    if (!alertModal.classList.contains('is-active')) {
      this.toggleModal(false);
    }
  }

  getNotificationCategory() {
    if (this.notification) {
      this.getCategory();
      this.getRuleConfiguration();
      this.getDeliveryConfiguration();
    }
  }

  public toggleModal(isOpen: Boolean) {
    const modalWindow = <HTMLDivElement>document.getElementById('notification-instance-modal');
    if (isOpen) {
      modalWindow.classList.add('is-active');
      return;
    }

    this.reenableButton.emit(false);
    this.rulePluginChangedConfig = {};
    this.deliveryPluginChangedConfig = {};
    this.notificationChangedConfig = {};
    this.apiCallsStack = [];
    this.category = null;
    this.notify.emit(false);
    this.ruleConfiguration = null;
    this.deliveryConfiguration = null;
    modalWindow.classList.remove('is-active');
  }

  public getRuleConfiguration(): void {
    const notificationName = this.notification['name'];
    this.configService.getCategory(`rule${notificationName}`).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            this.ruleConfiguration = { key: `rule${notificationName}`, config: data };
            this.ruleConfigurationCopy = cloneDeep({ key: `rule${notificationName}`, config: data });
          }
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText, true);
          }
        });
  }

  public getDeliveryConfiguration(): void {
    /** request started */
    this.ngProgress.start();
    const notificationName = this.notification['name'];
    this.configService.getCategory(`delivery${notificationName}`).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            this.deliveryConfiguration = { key: `delivery${notificationName}`, config: data };
            this.deliveryConfigurationCopy = cloneDeep({ key: `delivery${notificationName}`, config: data });
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
        });
  }

  public getCategory(): void {
    /** request started */
    this.ngProgress.start();
    const notificationName = this.notification['name'];
    this.configService.getCategory(notificationName).
      subscribe(
        (data: any) => {
          if (!isEmpty(data)) {
            data.channel['readonly'] = 'true';
            data.rule['readonly'] = 'true';
            this.category = { name: notificationName, config: data };
            this.categoryCopy = cloneDeep({ name: notificationName, config: data });
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
        });
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  deleteNotification(notificationName: string) {
    this.ngProgress.start();
    this.notificationService.deleteNotification(notificationName)
      .subscribe(
        (data: any) => {
          this.ngProgress.done();
          this.alertService.success(data['result'], true);
          this.toggleModal(false);
          this.notify.emit();
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

  getChangedNotificationConfig(changedConfiguration: any) {
    this.notificationChangedConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, this.categoryCopy);
  }

  getChangedRuleConfig(changedConfiguration: any) {
    this.rulePluginChangedConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, this.ruleConfigurationCopy);
  }

  getChangedDeliveryConfig(changedConfiguration: any) {
    this.deliveryPluginChangedConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, this.deliveryConfigurationCopy);
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
      this.reenableButton.emit(false);
      return;
    }

    this.apiCallsStack.push(this.configService.
      updateBulkConfiguration(categoryName, configuration).pipe(catchError(e => of(e))));
  }

  save() {
    if (!isEmpty(this.notificationChangedConfig) && this.category?.name) {
      this.updateConfiguration(this.category?.name, this.notificationChangedConfig);
    }
    if (!isEmpty(this.ruleConfiguration) && this.ruleConfiguration?.key) {
      this.updateConfiguration(this.ruleConfiguration?.key, this.rulePluginChangedConfig);
    }

    if (!isEmpty(this.deliveryConfiguration) && this.deliveryConfiguration?.key) {
      this.updateConfiguration(this.deliveryConfiguration?.key, this.deliveryPluginChangedConfig);
    }

    if (this.apiCallsStack.length > 0) {
      this.ngProgress.start();
      forkJoin(this.apiCallsStack).subscribe(() => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertService.success('Configuration updated successfully.', true);
        this.toggleModal(false);
        this.apiCallsStack = [];
      });
    } else {
      this.toggleModal(false);
    }
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  /**
  * To upload script files of a configuration property
  * @param categoryName name of the configuration category
  * @param files : Scripts array to uplaod
  */
  public uploadScript(categoryName: string, files: any[]) {
    this.fileUploaderService.uploadConfigurationScript(categoryName, files);
    if (isEmpty(this.notificationChangedConfig) && isEmpty(this.rulePluginChangedConfig)
      && isEmpty(this.deliveryPluginChangedConfig)) {
      this.toggleModal(false);
    }
  }

  goToLink() {
    const urlSlug = 'editing-notifications';
    this.docService.goToServiceDocLink(urlSlug, 'fledge-service-notification');
  }
}
