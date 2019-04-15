import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { assign, cloneDeep, reduce, sortBy, map, isEmpty } from 'lodash';

import {
  NotificationsService, ProgressBarService,
  AlertService, ConfigurationService
} from '../../../../services/index';
import { ViewConfigItemComponent } from '../../configuration-manager/view-config-item/view-config-item.component';

@Component({
  selector: 'app-add-notification-wizard',
  templateUrl: './add-notification-wizard.component.html',
  styleUrls: ['./add-notification-wizard.component.css']
})
export class AddNotificationWizardComponent implements OnInit {
  @ViewChild('desc') description: ElementRef;
  @ViewChild('name') name: ElementRef;

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

  notificationForm = new FormGroup({
    name: new FormControl(),
    description: new FormControl(),
    rule: new FormControl(),
    delivery: new FormControl(),
    type: new FormControl()
  });

  @ViewChild(ViewConfigItemComponent) viewConfigItemComponent: ViewConfigItemComponent;

  constructor(private formBuilder: FormBuilder,
    private notificationService: NotificationsService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService,
    private configService: ConfigurationService,
    private router: Router) { }

  ngOnInit() {
    this.getNotificationPlugins();
    this.getNotificationTypeList();
    this.notificationForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      rule: ['', Validators.required],
      delivery: ['', Validators.required],
      type: ['', Validators.required],
    });
  }

  getNotificationPlugins() {
    /** request started */
    this.ngProgress.start();
    this.notificationService.getNotificationPlugins().subscribe(
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
      });
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
        this.pageId = +id;
        this.viewConfigItemComponent.callFromWizard();
        document.getElementById('vci-proxy').click();
        if (this.viewConfigItemComponent !== undefined && !this.viewConfigItemComponent.isValidForm) {
          return false;
        }
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
        this.pageId = +id;
        this.viewConfigItemComponent.callFromWizard();
        document.getElementById('vci-proxy').click();
        if (this.viewConfigItemComponent !== undefined && !this.viewConfigItemComponent.isValidForm) {
          return false;
        }
        nxtButton.textContent = 'Done';
        previousButton.textContent = 'Previous';
        break;
      case 6:
        this.pageId = +id;
        if (formValues['type'].length > 0) {
          this.payload.notification_type = formValues['type'];
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

  /**
   * Get edited configuration from view config child page
   * @param changedConfig changed configuration of a selected plugin
   */
  getPluginChangedConfig(changedConfig: any, pluginConfigurationData: any, pageId: number) {
    const defaultConfig = map(pluginConfigurationData.value[0], (v, key) => ({ key, ...v }));
    // make a copy of matched config items having changed values
    const matchedConfig = defaultConfig.filter(e1 => {
      return changedConfig.some(e2 => {
        return e1.key === e2.key;
      });
    });

    // make a deep clone copy of matchedConfig array to remove extra keys(not required in payload)
    const matchedConfigCopy = cloneDeep(matchedConfig);
    /**
     * merge new configuration with old configuration,
     * where value key hold changed data in config object
    */
    matchedConfigCopy.forEach(e => {
      changedConfig.forEach(c => {
        if (e.key === c.key) {
          e.value = c.value.toString();
        }
      });
    });

    // final array to hold changed configuration
    const finalConfig = [];
    matchedConfigCopy.forEach(item => {
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
          this.notificationForm.controls['type'].setValue(this.notificationTypeList[0]);
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
   * Method to add service
   * @param payload  to pass in request
   * @param nxtButton button to go next
   * @param previousButton button to go previous
   */
  public addNotificationInstance(payload: any) {
    /** request started */
    this.ngProgress.start();
    this.notificationService.addNotificationInstance(payload)
      .subscribe(
        (data: any) => {
          /** request done */
          this.ngProgress.done();
          this.alertService.success(data.result, true);
          if (!isEmpty(this.rulePluginChangedConfig)) {
            this.updateConfiguration(`rule${payload.name}`, this.rulePluginChangedConfig);
          }
          if (!isEmpty(this.deliveryPluginChangedConfig)) {
            this.updateConfiguration(`delivery${payload.name}`, this.deliveryPluginChangedConfig);
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

  updateConfiguration(categoryName: string, config: any) {
    this.configService.updateBulkConfiguration(categoryName, config).
      subscribe(
        (data: any) => {
          console.log('configuration updated successfully', data);
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
}
