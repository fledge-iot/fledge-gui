import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { isEmpty } from 'lodash';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, ConfigurationService, SchedulesService } from '../../../../services';
import { ConfigChildrenComponent } from '../../configuration-manager/config-children/config-children.component';
import { ViewConfigItemComponent } from '../../configuration-manager/view-config-item/view-config-item.component';

@Component({
  selector: 'app-south-service-modal',
  templateUrl: './south-service-modal.component.html',
  styleUrls: ['./south-service-modal.component.css']
})
export class SouthServiceModalComponent implements OnInit, OnChanges {

  public category: any;
  public useProxy: 'true';
  public isEnabled = false;
  public isAdvanceConfig = false;
  public advanceConfigButtonText = 'Show Advanced Config';
  svcCheckbox: FormControl = new FormControl();

  public childConfiguration;
  public changedChildConfig = [];

  @Input() service: { service: any };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild(ViewConfigItemComponent) viewConfigItemComponent: ViewConfigItemComponent;
  @ViewChild(ConfigChildrenComponent) configChildrenComponent: ConfigChildrenComponent;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    public ngProgress: NgProgress,
    private schedulesService: SchedulesService) { }

  ngOnInit() {
    this.svcCheckbox.valueChanges.subscribe(val => {
      this.isEnabled = val;
    });
  }

  ngOnChanges() {
    if (this.service !== undefined) {
      this.getCategory();
      this.checkIfAdvanceConfig(this.service['name']);
    }
  }
  public toggleModal(isOpen: Boolean) {
    const modalWindow = <HTMLDivElement>document.getElementById('south-service-modal');
    if (isOpen) {
      this.svcCheckbox.setValue((this.service['status'] === 'down' || this.service['status'] === '') ? false : true);
      modalWindow.classList.add('is-active');
      return;
    }
    this.isAdvanceConfig = true;
    this.getAdvanceConfig(null);
    modalWindow.classList.remove('is-active');
  }

  public getCategory(): void {
    /** request started */
    this.ngProgress.start();
    const categoryValues = [];
    this.configService.getCategory(this.service['name']).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            categoryValues.push(data);
            this.category = { key: this.service['name'], value: categoryValues };
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
        }
      );
  }

  public showNotification() {
    const notificationMsg = <HTMLDivElement>document.getElementById('message');
    notificationMsg.classList.remove('is-hidden');
    return false;
  }

  public hideNotification() {
    const deleteBtn = <HTMLDivElement>document.getElementById('delete');
    deleteBtn.parentElement.classList.add('is-hidden');
    return false;
  }

  public disableSchedule(serviceName) {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.disableScheduleByName(serviceName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.notify.emit();
          this.alertService.success(data['message'], true);
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

  public enableSchedule(serviceName) {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.enableScheduleByName(serviceName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.notify.emit();
          this.alertService.success(data['message'], true);
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

  changeServiceStatus(serviceName) {
    this.toggleModal(false);
    if (!this.svcCheckbox.dirty && !this.svcCheckbox.touched) {
      return false;
    }
    if (this.isEnabled) {
      this.enableSchedule(serviceName);
      this.svcCheckbox.reset(true);
    } else if (!this.isEnabled) {
      this.disableSchedule(serviceName);
      this.svcCheckbox.reset(false);
    }
  }

  checkIfAdvanceConfig(categoryName) {
    this.configService.getCategoryConfigChildren(categoryName).
      subscribe(
        (data: any) => {
          this.childConfiguration = data.categories[0];
        },
        error => {
          console.log('error ', error);
        }
      );
  }

  getAdvanceConfig(childConfig) {
    if (!this.isAdvanceConfig) {
      this.isAdvanceConfig = true;
      this.advanceConfigButtonText = 'Hide Advanced Config';
      this.configChildrenComponent.getAdvanceConfig(childConfig, this.isAdvanceConfig);
    } else {
      this.isAdvanceConfig = false;
      this.advanceConfigButtonText = 'Show Advanced Config';
    }
  }

  /**
   * Get edited configuration from child config page
   * @param changedConfig changed configuration of a selected plugin
   */
  getChangedConfig(changedConfig) {
    changedConfig = changedConfig.filter(e => {
      return e.value !== null;
    });
    this.changedChildConfig = changedConfig;
  }

  proxy() {
    document.getElementById('vci-proxy').click();
    if (this.viewConfigItemComponent !== undefined && !this.viewConfigItemComponent.isValidForm) {
      return false;
    } else {
      this.changedChildConfig.forEach(changedItem => {
        this.saveConfigValue(changedItem.key, changedItem.value, changedItem.type);
      });
    }
    document.getElementById('ss').click();
  }



  public saveConfigValue(configItem: string, value: string, type: string) {
    /** request started */
    this.ngProgress.start();
    this.configService.saveConfigItem(this.childConfiguration.key, configItem, value.toString(), type).
      subscribe(
        () => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success('Configuration updated successfully.');
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


