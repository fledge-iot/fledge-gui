import { Component, OnInit, Input, Output, EventEmitter, OnChanges, ViewChild, HostListener } from '@angular/core';

import { isEmpty } from 'lodash';

import {
  ConfigurationService, AlertService,
  ProgressBarService,
  NotificationsService
} from '../../../../services';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';
import { ViewConfigItemComponent } from '../../configuration-manager/view-config-item/view-config-item.component';
import { ValidateFormService } from '../../../../services/validate-form.service';

@Component({
  selector: 'app-notification-modal',
  templateUrl: './notification-modal.component.html',
  styleUrls: ['./notification-modal.component.css']
})
export class NotificationModalComponent implements OnInit, OnChanges {

  @Input() notification: { notification: any };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  public useRuleProxy: 'true';
  public useDeliveryProxy: 'true';
  public useProxy: 'true';
  public category: any;
  public ruleConfiguration: any;
  public deliveryConfiguration: any;
  public notificationRecord: any;
  public changedChildConfig = [];

  rulePluginChangedConfig = [];
  deliveryPluginChangedConfig = [];
  notificationChangedConfig = [];

  @ViewChild(AlertDialogComponent, { static: true }) child: AlertDialogComponent;
  @ViewChild('notificationConfigView', { static: false }) viewConfigItemComponent: ViewConfigItemComponent;
  @ViewChild('ruleConfigView', { static: false }) ruleConfigView: ViewConfigItemComponent;
  @ViewChild('deliveryConfigView', { static: false }) deliveryConfigView: ViewConfigItemComponent;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    private notificationService: NotificationsService,
    private validateFormService: ValidateFormService,
    public ngProgress: ProgressBarService) { }

  ngOnInit() { }

  ngOnChanges() {
    if (this.notification !== undefined) {
      this.getCategory();
      this.getRuleConfiguration();
      this.getDeliveryConfiguration();
    }
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    const alertModal = <HTMLDivElement>document.getElementById('modal-box');
    if (!alertModal.classList.contains('is-active')) {
      this.toggleModal(false);
    }
  }

  public toggleModal(isOpen: Boolean) {
    const modalWindow = <HTMLDivElement>document.getElementById('notification-instance-modal');
    if (isOpen) {
      modalWindow.classList.add('is-active');
      return;
    }
    this.notify.emit(false);
    modalWindow.classList.remove('is-active');
  }

  public getRuleConfiguration(): void {
    const categoryValues = [];
    const notificationName = this.notification['name'];
    this.configService.getCategory(`rule${notificationName}`).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            categoryValues.push(data);
            this.ruleConfiguration = { key: `rule${notificationName}`, value: categoryValues };
            this.useRuleProxy = 'true';
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
    const categoryValues = [];
    const notificationName = this.notification['name'];
    this.configService.getCategory(`delivery${notificationName}`).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            categoryValues.push(data);
            this.deliveryConfiguration = { key: `delivery${notificationName}`, value: categoryValues };
            this.useDeliveryProxy = 'true';
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

  public getCategory(): void {
    /** request started */
    this.ngProgress.start();
    const categoryValues = [];
    const notificationName = this.notification['name'];
    this.configService.getCategory(notificationName).
      subscribe(
        (data: any) => {
          if (!isEmpty(data)) {
            data.channel['readonly'] = 'true';
            data.rule['readonly'] = 'true';

            categoryValues.push(data);
            this.category = { key: notificationName, value: categoryValues };
            this.useProxy = 'true';
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

  /**
   * Open delete modal
   * @param message   message to show on alert
   * @param action here action is 'deleteNotification'
   */
  openDeleteModal(name: string) {
    this.notificationRecord = {
      name: name,
      message: 'Deleting this notification instance can not be undone. Continue',
      key: 'deleteNotification'
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
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

  proxy() {
    if (!(this.validateFormService.checkViewConfigItemFormValidity(this.viewConfigItemComponent)
      && this.validateFormService.checkViewConfigItemFormValidity(this.ruleConfigView)
      && this.validateFormService.checkViewConfigItemFormValidity(this.deliveryConfigView))) {
      return;
    }
    if (this.useProxy) {
      document.getElementById('vci-proxy').click();
    }
    if (this.useRuleProxy) {
      const el = <HTMLCollection>document.getElementsByClassName('vci-proxy-rule');
      for (const e of <any>el) {
        e.click();
      }
    }
    if (this.useDeliveryProxy) {
      const ele = <HTMLCollection>document.getElementsByClassName('vci-proxy-delivery');
      for (const e of <any>ele) {
        e.click();
      }
    }
    this.notify.emit();
    this.toggleModal(false);
  }
}
