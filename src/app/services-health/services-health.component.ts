import { Component, OnInit, ViewChild } from '@angular/core';
import { ServicesHealthService } from '../services/index';
import { POLLING_INTERVAL } from '../utils';
import { environment } from '../../environments/environment';
import { AlertService } from './../services/alert.service';
import Utils from '../utils';
import { NgProgress } from 'ngx-progressbar';
import { ModalComponent } from './../modal/modal.component';
@Component({
  selector: 'app-services-health',
  templateUrl: './services-health.component.html',
  styleUrls: ['./services-health.component.css']
})
export class ServicesHealthComponent implements OnInit {
  timer: any = '';
  time: number;
  public service_data;

  public isAdmin = false;
  // Object to hold schedule id and name to delete
  public shutDownServiceData = {
    port: '',
    key: '',
    message: '',
    protocol: '',
    address: ''
  };

  @ViewChild(ModalComponent) child: ModalComponent;

  constructor(private servicesHealthService: ServicesHealthService, private alertService: AlertService, public ngProgress: NgProgress) { }

  ngOnInit() {
    this.isAdmin = JSON.parse(sessionStorage.getItem('isAdmin'));
    this.getServiceData();
  }

  public getServiceData() {
    /** request started */
    this.ngProgress.start();
    this.servicesHealthService.getAllServices()
      .subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          if (data.error) {
            console.log('error in response', data.error);
            this.alertService.warning('Could not connect to API');
            return;
          }
          this.service_data = data.services;
          this.time = Utils.getCurrentDate();

        },
        (error) => {
          this.alertService.warning('Could not connect to API');
          console.log('error: ', error);
          /** request completed */
          this.ngProgress.done();
        });
  }

  checkServiceType(type, serviceStatus) {
    if (type == 'storage' || type == 'core') {
      return false;
    }
    else if (serviceStatus == 'running' || serviceStatus == 'unresponsive') {
      return true;
    }
    else {
      return false;
    }
  }

  openModal(port, name, protocol, address) {
    this.shutDownServiceData = {
      port: port,
      key: 'shutdownService',
      message: 'Do you really want to shut down ' + name + ' service',
      protocol: protocol,
      address: address
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }

  shutdownService(svcInfo) {
    /** request started */
    this.ngProgress.start();
    this.servicesHealthService.shutDownService(svcInfo)
      .subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data.message)
          this.getServiceData();
        },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
            /** request completed */
            this.ngProgress.done();
          } else {
            this.alertService.error(error.statusText);
            /** request completed */
            this.ngProgress.done();
          }
        });
  }

  padRight(s: string) {
    const diff = 10 - s.length;
    if (diff) {
      for (let i = 1; i <= diff; i++) {
        s += "  ";
      }
    }
    return s;
  }
}