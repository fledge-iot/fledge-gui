import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Parser } from 'json2csv';
import { isEmpty } from 'lodash';
import { NgProgress } from 'ngx-progressbar';

import { MAX_INT_SIZE } from '../../../../utils';

import {
  AlertService,
  AssetsService,
  ConfigurationService,
  SchedulesService,
  ServicesHealthService,
} from '../../../../services';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';
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
  private REQUEST_TIMEOUT_INTERVAL = 1000;
  assetReadings = [];

  // Object to hold data of south service to delete
  public serviceRecord = {
    port: '',
    protocol: '',
    name: '',
    message: '',
    key: ''
  };

  @Input() service: { service: any };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild(ViewConfigItemComponent) viewConfigItemComponent: ViewConfigItemComponent;
  @ViewChild(ConfigChildrenComponent) configChildrenComponent: ConfigChildrenComponent;
  @ViewChild(AlertDialogComponent) child: AlertDialogComponent;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    private assetService: AssetsService,
    public ngProgress: NgProgress,
    private servicesHealthService: ServicesHealthService,
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
      this.svcCheckbox.setValue(this.service['schedule_enabled']);
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
          this.childConfiguration = data.categories.find(d => d.key.toString().includes('Advanced'));
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

  proxy() {
    document.getElementById('vci-proxy').click();
    if (this.viewConfigItemComponent !== undefined && !this.viewConfigItemComponent.isValidForm) {
      return;
    } else {
      this.updateConfigConfiguration(this.changedChildConfig);
    }
    document.getElementById('ss').click();
  }

  public updateConfigConfiguration(configItems) {
    if (isEmpty(configItems)) {
      return;
    }
    /** request started */
    this.ngProgress.start();
    this.configService.updateBulkConfiguration(this.childConfiguration.key, configItems).
      subscribe(
        () => {
          this.changedChildConfig = [];  // clear the array
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

  /**
   * Open delete modal
   * @param message   message to show on alert
   * @param action here action is 'deleteService'
   */
  openDeleteModal(port, protocol, name, message, action) {
    this.serviceRecord = {
      port: port,
      protocol: protocol,
      name: name,
      message: message,
      key: action
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }

  getAssetReadings(service) {
    const assets = service.assets;
    this.assetReadings = [];
    if (assets.length === 0) {
      this.alertService.error('No reading to export.');
    }
    assets.forEach((ast, i) => {
      let limit = ast.count;
      let offset = 0;
      let isLastRequest = false;
      const fileName = service['name'] + '-readings.csv';
      if (ast.count > MAX_INT_SIZE) {
        let chunkCount;
        let lastChunkLimit;
        limit = MAX_INT_SIZE;
        chunkCount = Math.ceil(ast.count / MAX_INT_SIZE);
        lastChunkLimit = (ast.count % MAX_INT_SIZE);
        if (lastChunkLimit === 0) {
          lastChunkLimit = MAX_INT_SIZE;
        }
        for (let j = 0; j < chunkCount; j++) {
          if (j !== 0) {
            offset = (MAX_INT_SIZE * j);
          }
          if (j === (chunkCount - 1)) {
            limit = lastChunkLimit;
          }
          if (i === assets.length - 1 && j === (chunkCount - 1)) {
            isLastRequest = true;
          }
          this.alertService.activityMessage('Exporting readings to ' + fileName);
          this.exportReadings(ast.asset, limit, offset, isLastRequest, fileName);
        }
      } else {
        if (i === assets.length - 1) {
          isLastRequest = true;
        }
        this.alertService.activityMessage('Exporting readings to ' + fileName);
        this.exportReadings(ast.asset, limit, offset, isLastRequest, fileName);
      }
    });
  }

  exportReadings(asset, limit, offset, lastRequest, fileName) {
    const fields = ['assetName', 'reading', 'timestamp'];
    const opts = { fields };
    this.assetService.getAssetReadings(encodeURIComponent(asset), limit, offset).
      subscribe(
        (result: any[]) => {
          result = result.map(r => {
            r['assetName'] = asset;
            return r;
          });
          this.assetReadings = this.assetReadings.concat(result);
          if (lastRequest === true) {
            setTimeout(() => {
              const parser = new Parser(opts);
              const csv = parser.parse(this.assetReadings);
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              // create a custom anchor tag
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => {
                this.alertService.closeMessage();
              }, this.REQUEST_TIMEOUT_INTERVAL);
            }, this.REQUEST_TIMEOUT_INTERVAL);
          }
        },
        error => {
          console.log('error in response', error);
        });
  }

  deleteService(svc) {
    this.ngProgress.start();
    this.servicesHealthService.deleteService(svc.name)
      .subscribe(
        (data) => {
          this.ngProgress.done();
          this.alertService.success(data['result'], true);
          this.toggleModal(false);
          setTimeout(() => {
            this.notify.emit();
          }, 6000);
        },
        (error) => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }
}
