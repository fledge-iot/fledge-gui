import { Component, OnInit, Input, Output, EventEmitter, OnChanges, ViewChild, HostListener, QueryList, ViewChildren } from '@angular/core';
import { isEmpty } from 'lodash';
import {
  ConfigurationService, AlertService,
  ProgressBarService,
  NotificationsService
} from '../../../../services';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';
import { ViewConfigItemComponent } from '../../configuration-manager/view-config-item/view-config-item.component';
import { ValidateFormService } from '../../../../services/validate-form.service';
import { DocService } from '../../../../services/doc.service';

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
  public deliveryConfiguration = [];
  public notificationRecord: any;
  public changedChildConfig = [];
  public isWizard;
  rulePluginChangedConfig = [];
  deliveryPluginChangedConfig = [];
  notificationChangedConfig = [];
  notificationDeliveryChannels = [];

  @ViewChild(AlertDialogComponent, { static: true }) child: AlertDialogComponent;
  @ViewChild('notificationConfigView') viewConfigItemComponent: ViewConfigItemComponent;
  @ViewChild('ruleConfigView') ruleConfigView: ViewConfigItemComponent;
  @ViewChildren('deliveryChannelConfigView') deliveryConfigViews: QueryList<ViewConfigItemComponent>;;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    private notificationService: NotificationsService,
    private validateFormService: ValidateFormService,
    public ngProgress: ProgressBarService,
    private docService: DocService) { }

  ngOnInit() { }

  ngOnChanges() {
    if (this.notification !== undefined) {
      this.getCategory();
      this.getRuleConfiguration();
      // this.getDeliveryConfiguration();
      this.getDeliveryChannels()
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
    if (this.isWizard) {
      this.isWizard = false;
      this.getCategory();
    }
    this.notify.emit(false);
    this.ruleConfiguration = [];
    this.deliveryConfiguration = [];

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

  openChannelModal(isClicked: boolean) {
    this.isWizard = isClicked;
  }

  onNotify() {
    this.isWizard = false;
    this.getCategory();
    this.getDeliveryChannels();
  }

  proxy() {
    if (!(this.validateFormService.checkViewConfigItemFormValidity(this.viewConfigItemComponent)
      && this.validateFormService.checkViewConfigItemFormValidity(this.ruleConfigView))) {
      return;
    }

    const deliverChannelFormStatus = this.deliveryConfigViews.toArray().every(component => {
      return this.validateFormService.checkViewConfigItemFormValidity(component);
    });

    if (!deliverChannelFormStatus) {
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

  getDeliveryChannels() {
    const notificationName = this.notification['name'];
    this.notificationService.getDeliveryChannels(notificationName)
      .subscribe(
        (data: any) => {
          this.notificationDeliveryChannels = data.channels;
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

  activeAccordion(id, channelName: string) {
    this.useDeliveryProxy = 'true';
    const last = <HTMLElement>document.getElementsByClassName('accordion card is-active')[0];
    if (last !== undefined) {
      const lastActiveContentBody = <HTMLElement>last.getElementsByClassName('card-content')[0];
      const activeId = last.getAttribute('id');
      lastActiveContentBody.hidden = true;
      last.classList.remove('is-active');
      if (id !== +activeId) {
        const next = <HTMLElement>document.getElementById(id);
        const nextActiveContentBody = <HTMLElement>next.getElementsByClassName('card-content')[0];
        nextActiveContentBody.hidden = false;
        next.setAttribute('class', 'accordion card is-active');
        this.getDeliveryConfiguration(channelName);
      } else {
        last.classList.remove('is-active');
        lastActiveContentBody.hidden = true;
      }
    } else {
      const element = <HTMLElement>document.getElementById(id);
      const body = <HTMLElement>element.getElementsByClassName('card-content')[0];
      body.hidden = false;
      element.setAttribute('class', 'accordion card is-active');
      this.getDeliveryConfiguration(channelName);
    }
  }

  getDeliveryConfiguration(channel: any) {
    const catName = channel.category;
    this.notificationService.getNotificationConfiguration(catName)
      .subscribe((data: any) => {
        this.deliveryConfiguration.push({ key: catName, 'value': [data] });
        this.useDeliveryProxy = 'true';
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  setChannelConfiguration(channel: any) {
    const catName = channel.category;
    return this.deliveryConfiguration.find(f => f.key === catName);
  }

  deleteDeliveryChannel(channel) {
    const notificationName = this.notification['name'];
    this.notificationService.deleteDeliveryChannel(notificationName, channel.name)
      .subscribe(() => {
        this.alertService.success(`${channel.name} deleted successfully.`);
        this.getDeliveryChannels();
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  /**
  * Get edited configuration from child config page
  * @param changedConfig changed configuration of a selected plugin
  */
  getChangedConfig(changedConfig) {
    if (isEmpty(changedConfig)) {
      return;
    }
    changedConfig = changedConfig.map(el => {
      if (el.type.toUpperCase() === 'JSON') {
        el.value = JSON.parse(el.value);
      }
      return {
        [el.key]: el.value !== undefined ? el.value : el.default,
      };
    });

    changedConfig = Object.assign({}, ...changedConfig); // merge all object into one
    this.changedChildConfig = changedConfig;
  }



  goToLink() {
    const urlSlug = 'editing-notifications';
    this.docService.goToNotificationDocLink(urlSlug);
  }
}
