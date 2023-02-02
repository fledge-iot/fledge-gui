import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { cloneDeep, sortBy } from 'lodash';

import {
  NotificationsService, ProgressBarService,
  AlertService, SharedService, ConfigurationControlService,
  FileUploaderService
} from '../../../../services/index';
import { ViewLogsComponent } from '../../logs/packages-log/view-logs/view-logs.component';
import { delay, retryWhen, take } from 'rxjs/operators';
import { DocService } from '../../../../services/doc.service';

@Component({
  selector: 'app-add-notification-wizard',
  templateUrl: './add-notification-wizard.component.html',
  styleUrls: ['./add-notification-wizard.component.css']
})
export class AddNotificationWizardComponent implements OnInit, OnDestroy {
  @ViewChild('retriggerTime') retriggerTime: ElementRef;

  public notificationRulePlugins = [];
  public notificationDeliveryPlugins = [];
  public notificationTypeList = [];

  public isRulePlugin = true;
  public isDeliveryPlugin = true;
  public isSinglePlugin = true;
  public isNotificationEnabled = true;

  public payload: any = {};
  public rulePluginConfiguration: any;
  public rulePluginConfigurationCopy: any;

  public deliveryPluginConfiguration: any;
  public deliveryPluginConfigurationCopy: any;

  public selectedRulePluginDescription: string;
  public selectedDeliveryPluginDescription: string;

  public selectedRulePlugin: string;
  public selectedDeliveryPlugin: string;

  public notificationType: string;
  private subscription: Subscription;

  notificationForm = new FormGroup({
    name: new FormControl(),
    description: new FormControl(),
    rule: new FormControl(),
    delivery: new FormControl(),
    retriggerTime: new FormControl()
  });

  @ViewChild(ViewLogsComponent, { static: true }) viewLogsComponent: ViewLogsComponent;

  public pluginData = {
    modalState: false,
    type: '',
    pluginName: ''
  };

  validConfigurationForm = true;

  constructor(private formBuilder: FormBuilder,
    private notificationService: NotificationsService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService,
    private sharedService: SharedService,
    private docService: DocService,
    private configurationControlService: ConfigurationControlService,
    private fileUploaderService: FileUploaderService,
    private router: Router) { }

  ngOnInit() {
    this.getNotificationPlugins();
    this.getNotificationTypeList();
    this.notificationForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      rule: ['', Validators.required],
      delivery: ['', Validators.required],
      retriggerTime: ['60', Validators.required]
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

    this.name?.valueChanges?.subscribe(v => {
      if (v.length > 0) {
        this.description?.patchValue(`${v} notification instance`)
      } else {
        this.description.patchValue('');
      }
      this.notificationForm?.updateValueAndValidity();
    })
  }

  get name() { return this.notificationForm.get('name'); }

  get description() { return this.notificationForm.get('description'); }

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
            /** request completed */
            this.ngProgress.done();
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
    const last = <HTMLElement>document.getElementsByClassName('step-item is-active')[0];
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
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Back';
        nxtButton.disabled = false;
        break;
      case 3:
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Back';
        nxtButton.disabled = false;
        break;
      case 4:
        nxtButton.textContent = 'Next';
        nxtButton.disabled = false;
        break;
      case 5:
        nxtButton.textContent = 'Next';
        nxtButton.disabled = false;
        break;
      case 6:
        nxtButton.textContent = 'Next';
        nxtButton.disabled = false;
        break;
      default:
        break;
    }
  }

  moveNext() {
    this.isRulePlugin = true;
    this.isDeliveryPlugin = true;
    const formValues = this.notificationForm.value;
    const first = <HTMLElement>document.getElementsByClassName('step-item is-active')[0];
    const id = first.getAttribute('id');
    const nxtButton = <HTMLButtonElement>document.getElementById('next');
    const previousButton = <HTMLButtonElement>document.getElementById('previous');
    switch (+id) {
      case 1:
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Previous';
        if (formValues['name'].trim() !== '') {
          this.payload.name = formValues['name'];
          this.payload.description = formValues['description'];
        }
        if (this.notificationRulePlugins.length === 0) {
          nxtButton.disabled = true;
        }
        break;
      case 2:
        nxtButton.disabled = false;
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
        nxtButton.textContent = 'Next';
        previousButton.textContent = 'Previous';
        if (this.notificationDeliveryPlugins.length === 0) {
          nxtButton.disabled = true;
        }
        break;
      case 4:
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
        nxtButton.textContent = 'Done';
        previousButton.textContent = 'Previous';
        break;
      case 6:
        if (this.notificationType.length > 0) {
          this.payload.notification_type = this.notificationType;
        }
        this.payload.enabled = this.isNotificationEnabled;
        this.payload.retrigger_time = this.retriggerTime.nativeElement.value;
        if (this.payload.retrigger_time < 1) {
          return;
        }
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
    if (pluginType === 'rule') {
      this.selectedRulePlugin = plugin;
      this.selectedRulePluginDescription = this.notificationRulePlugins
        .find(p => p.config.plugin.default === plugin).config.plugin.description;
    } else {
      this.selectedDeliveryPlugin = plugin;
      this.selectedDeliveryPluginDescription = this.notificationDeliveryPlugins
        .find(p => p.config.plugin.default === plugin).config.plugin.description;
    }
  }

  private getDeliveryPluginConfiguration(): void {
    const plugin = this.notificationDeliveryPlugins.find(p => p.name === this.payload.channel);
    if (plugin) {
      this.deliveryPluginConfiguration = plugin;
      this.deliveryPluginConfigurationCopy = cloneDeep(plugin);
    }
  }

  /**
 *  Get default configuration of the selected plugin
 */
  private getRulePluginConfiguration(): void {
    const plugin = this.notificationRulePlugins.find(p => p.name === this.payload.rule);
    if (plugin) {
      this.rulePluginConfiguration = plugin;
      this.rulePluginConfigurationCopy = cloneDeep(plugin);
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
  getChangedRuleConfig(changedConfig: any) {
    this.payload.rule_config = this.configurationControlService.getChangedConfiguration(changedConfig, this.rulePluginConfigurationCopy);
  }

  /**
   * Get edited configuration from view config child page
   * @param changedConfig changed configuration of a selected plugin
   */
  getChangedDeliveryConfig(changedConfig: any) {
    this.payload.delivery_config = this.configurationControlService.getChangedConfiguration(changedConfig, this.deliveryPluginConfigurationCopy);
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
    // extract script files to upload from final payload
    const deliveryScriptFiles = this.getScriptFilesToUpload(payload.delivery_config);
    const rulesScriptFiles = this.getScriptFilesToUpload(payload.rule_config);

    /** request started */
    this.ngProgress.start();
    this.notificationService.addNotificationInstance(payload)
      .subscribe(
        (data: any) => {
          /** request done */
          this.ngProgress.done();
          this.alertService.success(data.result, true);
          const name = this.payload.name
          if (rulesScriptFiles.length > 0) {
            this.uploadScript(`rule${name}`, rulesScriptFiles);
          }

          if (deliveryScriptFiles.length > 0) {
            this.uploadScript(`delivery${name}`, deliveryScriptFiles);
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

  /**
   * Open readthedocs.io documentation of notification plugins
   * @param selectedPlugin Selected rule/delivery  plugin
   * @param pluginType Type of the plugin (e.g. rule/notify)
   */
  goToLink(selectedPlugin: string, pluginType: string) {
    const pluginInfo = {
      name: selectedPlugin,
      type: pluginType
    };
    this.docService.goToPluginLink(pluginInfo);
  }

  goToNotificationTypeLink() {
    const urlSlug = 'notification-types';
    this.docService.goToNotificationDocLink(urlSlug);
  }


  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
