import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { assign, reduce, sortBy, isEmpty } from 'lodash';

import {
  NotificationsService, ProgressBarService,
  AlertService, ConfigurationService, SharedService
} from '../../../../services/index';
import { ViewConfigItemComponent } from '../../configuration-manager/view-config-item/view-config-item.component';
import { ViewLogsComponent } from '../../packages-log/view-logs/view-logs.component';
import { delay, retryWhen, take } from 'rxjs/operators';
import { ValidateFormService } from '../../../../services/validate-form.service';

@Component({
  selector: 'app-add-notification-wizard',
  templateUrl: './add-notification-wizard.component.html',
  styleUrls: ['./add-notification-wizard.component.css']
})
export class AddNotificationWizardComponent implements OnInit, OnDestroy {
  @ViewChild('desc', { static: false }) description: ElementRef;
  @ViewChild('name', { static: false }) name: ElementRef;

  public notificationRulePlugins = [];
  public notificationDeliveryPlugins = [];
  public notificationTypeList = [];

  public isValidName = true;
  public isRulePlugin = true;
  public isDeliveryPlugin = true;
  public isSinglePlugin = true;
  public isNotificationEnabled = true;

  public payload: any = {};
  public rulePluginConfigurationData: any;
  public rulePluginChangedConfig: any;

  public deliveryPluginConfigurationData: any;
  public deliveryPluginChangedConfig: any;
  public selectedRulePluginDescription: string;
  public selectedDeliveryPluginDescription: string;

  public useProxy: string;

  public pageId: number;
  public notificationType: string;
  private subscription: Subscription;

  notificationForm = new FormGroup({
    name: new FormControl(),
    description: new FormControl(),
    rule: new FormControl(),
    delivery: new FormControl()
  });

  @ViewChild(ViewConfigItemComponent, { static: false }) viewConfigItemComponent: ViewConfigItemComponent;
  @ViewChild(ViewLogsComponent, { static: true }) viewLogsComponent: ViewLogsComponent;

  public pluginData = {
    modalState: false,
    type: '',
    pluginName: ''
  };

  constructor(private formBuilder: FormBuilder,
    private notificationService: NotificationsService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService,
    private configService: ConfigurationService,
    private sharedService: SharedService,
    private validateFormService: ValidateFormService,
    private router: Router) { }

  ngOnInit() {
    this.getNotificationPlugins();
    this.getNotificationTypeList();
    this.notificationForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      rule: ['', Validators.required],
      delivery: ['', Validators.required]
    });
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

  /**
   * Open plugin modal
   */
  openPluginModal(state: boolean, pluginType: string) {
    this.pluginData = {
      modalState: state,
      type: pluginType,
      pluginName: ''
    };
  }

  getNotificationPlugins(isPluginInstalled?: boolean) {
    /** request started */
    this.ngProgress.start();
    setTimeout(() => {
      this.notificationService.getNotificationPlugins()
        .pipe(retryWhen(errors => errors.pipe(delay(2000), take(3))))
        .subscribe(
          (data: any) => {
            /** request completed */
            this.ngProgress.done();
            this.notificationRulePlugins = sortBy(data.rules, p => {
              return p.name.toLowerCase();
            });
            this.notificationDeliveryPlugins = sortBy(data.delivery, p => {
              return p.name.toLowerCase();
            });
          },
          (error) => {
            /** request completed */
            this.ngProgress.done();
            if (error.status === 0) {
              console.log('service down ', error);
            } else {
              this.alertService.error(error.statusText);
            }
          },
          () => {
            setTimeout(() => {
              if (isPluginInstalled) {
                this.pluginData.modalState = false;
                this.selectInstalledPlugin();
              }
            }, 1000);
          });
    }, 2000);
  }

  movePrevious() {
    const last = <HTMLElement>document.getElementsByClassName('is-active')[0];
    const id = last.getAttribute('id');

    if (+id === 1) {
      this.router.navigate(['/notification']);
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
        this.pageId = +id - 2;
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Back';
        nxtButton.disabled = false;
        break;
      case 3:
        this.pageId = +id - 2;
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Back';
        nxtButton.disabled = false;
        break;
      case 4:
        this.pageId = +id - 2;
        nxtButton.textContent = 'Next';
        nxtButton.disabled = false;
        break;
      case 5:
        this.pageId = +id - 2;
        nxtButton.textContent = 'Next';
        nxtButton.disabled = false;
        break;
      case 6:
        this.pageId = +id - 2;
        nxtButton.textContent = 'Next';
        nxtButton.disabled = false;
        break;
      default:
        break;
    }
  }

  moveNext() {
    this.isValidName = true;
    this.isRulePlugin = true;
    this.isDeliveryPlugin = true;
    const formValues = this.notificationForm.value;
    const first = <HTMLElement>document.getElementsByClassName('is-active')[0];
    const id = first.getAttribute('id');
    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const previousButton = <HTMLButtonElement>document.getElementById('previous');
    switch (+id) {
      case 1:
        this.pageId = +id;
        if (formValues['name'].trim() === '') {
          this.isValidName = false;
          return;
        }
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Previous';
        if (formValues['name'].trim() !== '') {
          this.payload.name = formValues['name'];
          this.payload.description = this.description.nativeElement.value;
        }
        if (this.notificationRulePlugins.length === 0) {
          nxtButton.disabled = true;
        }
        break;
      case 2:
        nxtButton.disabled = false;
        this.pageId = +id;
        if (formValues['rule'] === '') {
          this.isRulePlugin = false;
          return;
        }
        if (formValues['rule'].length !== 1) {
          this.isSinglePlugin = false;
          this.selectedRulePluginDescription = '';
          return;
        }

        if (formValues['rule'].length > 0) {
          this.payload.rule = formValues['rule'][0];
        }
        this.getRulePluginConfiguration();
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Previous';
        break;
      case 3:
        if (!(this.validateFormService.checkViewConfigItemFormValidity(this.viewConfigItemComponent))) {
          return;
        }
        this.pageId = +id;
        this.viewConfigItemComponent.callFromWizard();
        document.getElementById('vci-proxy').click();
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Previous';
        if (this.notificationDeliveryPlugins.length === 0) {
          nxtButton.disabled = true;
        }
        break;
      case 4:
        this.pageId = +id;
        if (formValues['delivery'] === '') {
          this.isDeliveryPlugin = false;
          return;
        }
        if (formValues['delivery'].length !== 1) {
          this.isSinglePlugin = false;
          this.selectedDeliveryPluginDescription = '';
          return;
        }

        if (formValues['delivery'].length > 0) {
          this.payload.channel = formValues['delivery'][0];
        }

        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Previous';
        this.getDeliveryPluginConfiguration();
        break;
      case 5:
        if (!(this.validateFormService.checkViewConfigItemFormValidity(this.viewConfigItemComponent))) {
          return;
        }
        this.pageId = +id;
        this.viewConfigItemComponent.callFromWizard();
        document.getElementById('vci-proxy').click();
        nxtButton.textContent = 'Done';
        previousButton.textContent = 'Previous';
        break;
      case 6:
        this.pageId = +id;
        if (this.notificationType.length > 0) {
          this.payload.notification_type = this.notificationType;
        }
        this.payload.enabled = this.isNotificationEnabled;
        this.addNotificationInstance(this.payload);
        break;
      default:
        break;
    }

    if (+id >= 6) {
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
  private getRulePluginConfiguration(): void {
    const config = this.notificationRulePlugins.map(p => {
      if (p.name === this.payload.rule) {
        return p.config;
      }
    }).filter(value => value !== undefined);

    // array to hold data to display on configuration page
    this.rulePluginConfigurationData = { value: config };
    this.useProxy = 'true';
  }

  isPluginSelected(selectedPlugin, pluginType: string) {
    if (selectedPlugin === '') {
      this.isSinglePlugin = false;
      this.selectedRulePluginDescription = '';
      this.selectedDeliveryPluginDescription = '';
      return;
    }

    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    nxtButton.disabled = false;

    this.isSinglePlugin = true;
    this.isRulePlugin = true;
    this.isDeliveryPlugin = true;
    const plugin = (selectedPlugin.slice(3).trim()).replace(/'/g, '');
    if (pluginType === 'notificationRule') {
      this.selectedRulePluginDescription = this.notificationRulePlugins
        .find(p => p.config.plugin.default === plugin).config.plugin.description;
    } else {
      this.selectedDeliveryPluginDescription = this.notificationDeliveryPlugins
        .find(p => p.config.plugin.default === plugin).config.plugin.description;
    }
  }

  private getDeliveryPluginConfiguration(): void {
    const config = this.notificationDeliveryPlugins.map(d => {
      if (d.name === this.payload.channel) {
        return d.config;
      }
    }).filter(value => value !== undefined);

    // array to hold data to display on configuration page
    this.deliveryPluginConfigurationData = { value: config };
    this.useProxy = 'true';
  }

  validateNotificationName(event: any) {
    if (event.target.value.trim().length > 0) {
      this.isValidName = true;
    }
    if (this.name.nativeElement.value.length > 0) {
      this.description.nativeElement.value = this.name.nativeElement.value + ' notification instance';
    } else {
      this.description.nativeElement.value = '';
    }
  }

  onCheckboxClicked(event) {
    if (event.target.checked) {
      this.isNotificationEnabled = true;
    } else {
      this.isNotificationEnabled = false;
    }
    this.payload.enabled = this.isNotificationEnabled;
  }

  public toggleDropDown(id: string) {
    const activeDropDowns = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDowns.length > 0) {
      if (activeDropDowns[0].id !== id) {
        activeDropDowns[0].classList.remove('is-active');
      }
    }
    const dropDown = document.querySelector(`#${id}`);
    dropDown.classList.toggle('is-active');
  }

  setNotificationType(type: string) {
    this.notificationType = type;
  }

  /**
   * Get edited configuration from view config child page
   * @param changedConfig changed configuration of a selected plugin
   */
  getPluginChangedConfig(changedConfig: any, pageId: number) {
    const finalConfig = [];
    changedConfig.forEach((item: any) => {
      finalConfig.push({
        [item.key]: item.type === 'JSON' ? JSON.parse(item.value) : item.value
      });
    });
    if (pageId === 3) {
      this.rulePluginChangedConfig = reduce(finalConfig, function (memo, current) { return assign(memo, current); }, {});
    } else if (pageId === 5) {
      this.deliveryPluginChangedConfig = reduce(finalConfig, function (memo, current) { return assign(memo, current); }, {});
    }
  }

  getNotificationTypeList() {
    this.notificationService.getNotificationTypeList()
      .subscribe(
        (data: []) => {
          this.notificationTypeList = data['notification_type'];
          this.notificationType = this.notificationTypeList[0];
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
   * Method to add notification
   * @param payload  to pass in request
   * @param nxtButton button to go next
   * @param previousButton button to go previous
   */
  public addNotificationInstance(payload: any) {
    payload['rule_config'] = this.rulePluginChangedConfig;
    payload['delivery_config'] = this.deliveryPluginChangedConfig;
    const ruleScript = this.rulePluginChangedConfig.script;
    const deliveryScript = this.deliveryPluginChangedConfig.script;
    delete payload['rule_config'].script;  // delete script key from payload object
    delete payload['delivery_config'].script; // delete script key from payload object

    /** request started */
    this.ngProgress.start();
    this.notificationService.addNotificationInstance(payload)
      .subscribe(
        (data: any) => {
          /** request done */
          this.ngProgress.done();
          this.alertService.success(data.result, true);

          if (!isEmpty(ruleScript)) {
            this.uploadScript(`rule${payload.name}`, ruleScript[0]);
          }

          if (!isEmpty(deliveryScript)) {
            this.uploadScript(`delivery${payload.name}`, deliveryScript[0]);
          }
          this.router.navigate(['/notification']);
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

  public uploadScript(categoryName: string, config: any) {
    const file = config.script;
    const formData = new FormData();
    formData.append('script', file);
    this.configService.uploadFile(categoryName, 'script', formData)
      .subscribe(() => {
        this.alertService.success('configuration updated successfully.');
      },
        error => {
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
    this.pluginData.type = event.type;
    if (event.pluginInstall) {
      this.getNotificationPlugins(event.pluginInstall);
    }
  }

  selectInstalledPlugin() {
    const select = <HTMLSelectElement>document.getElementById(this.pluginData.type.toLowerCase());
    for (let i = 0, j = select.options.length; i < j; ++i) {
      if (select.options[i].innerText.toLowerCase() === this.pluginData.pluginName.toLowerCase()) {
        if (this.pluginData.type.toLowerCase() === 'rule') {
          this.notificationForm.controls['rule'].setValue([this.notificationRulePlugins[i].name]);
        } else if (this.pluginData.type.toLowerCase() === 'notify') {
          this.notificationForm.controls['delivery'].setValue([this.notificationDeliveryPlugins[i].name]);
        }
        const nxtButton = <HTMLButtonElement>document.getElementById('next');
        nxtButton.disabled = false;
        select.selectedIndex = i;
        select.dispatchEvent(new Event('change'));
        break;
      }
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
