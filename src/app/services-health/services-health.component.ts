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
  // Object to hold schedule id and name to delete
  public childData = {
    id: '',
    name: '',
    key: '',
    message: ''
  };

  @ViewChild(ModalComponent) child: ModalComponent;

  constructor(private servicesHealthService: ServicesHealthService, private alertService: AlertService, public ngProgress: NgProgress) { }

  ngOnInit() {
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
          this.alertService.warning('Could not connect to Core Managment API, ' +
            'Make sure to set correct <a href="/setting"> core management port </a>');
          return;
        }
        this.service_data = data.services;
        this.time = Utils.getCurrentDate();

      },
      (error) => {
        this.alertService.warning('Could not connect to Core Managment API, ' +
          'Make sure to set correct <a href="/setting"> core management port </a>');
        console.log('error: ', error);
        /** request completed */
        this.ngProgress.done();
      });
  }

  checkServiceType(type) {
    if (type == 'storage' || type == 'core') {
      return false;
    }
    return true;
  }

  openModal(port, name) {
    this.childData = {
      id: port,
      name: '',
      key: 'shutdown',
      message: 'Do you realy want to shut down ' + name + ' service?'
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }

  shutdownService(port) {
    this.servicesHealthService.shutDownService(port)
      .subscribe(
      (data) => {
        this.alertService.success(data.message)
        this.getServiceData();
      },
      (error) => {
        if (error.status === 0) {
          console.log('service down ', error);
      } else {
          console.log('error in response ', error);
          this.alertService.error(error.statusText);
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