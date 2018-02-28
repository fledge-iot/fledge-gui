import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { ServicesHealthService } from '../services/index';
import { ConnectedServiceStatus } from "../services/connected-service-status.service";
import { POLLING_INTERVAL } from '../utils';
import { ModalComponent } from './../modal/modal.component';
import { NgProgress } from 'ngx-progressbar';
import { AlertService } from './../services/alert.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() toggle = new EventEmitter<string>();
  public timer: any = '';
  public ping_data = {};
  public ping_info = { is_alive: false, service_status: 'service down' };
  public childData = {
    key: '',
    message: ''
  };

  @ViewChild(ModalComponent) child: ModalComponent;

  constructor(private servicesHealthService: ServicesHealthService, private status: ConnectedServiceStatus, private alertService: AlertService, public ngProgress: NgProgress) { }

  ngOnInit() {
    this.start();
  }

  pingService() {
    this.servicesHealthService.pingService()
      .subscribe(
      (data) => {
        this.status.changeMessage(true);
        this.ping_data = data;
        this.ping_info = { is_alive: true, service_status: 'running...' };
      },
      (error) => {
        console.log('error: ', error);
        this.status.changeMessage(false);
        this.ping_info = { is_alive: false, service_status: 'service down' };
      },
    );
  }

  openModal() {
    this.childData = {
      key: 'shutdown',
      message: 'Do you really want to shut down the service'
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }

  shutdown(port) {
    /** request started */
    this.ngProgress.start();
    this.servicesHealthService.shutdown()
      .subscribe(
      (data) => {
        /** request completed */
        this.ngProgress.done();
        this.alertService.success(data.message);
      },
      (error) => {
        if (error.status === 0) {
          console.log('service down ', error);
          /** request completed */
          this.ngProgress.done();
        } else {
            console.log('error in response ', error);
            this.alertService.error(error.statusText);
            /** request completed */
            this.ngProgress.done();
        }
      });
  }

  start() {
    clearInterval(this.timer);
    this.timer = setInterval(function () {
      this.pingService();
    }.bind(this), POLLING_INTERVAL);
  }
  stop() {
    clearInterval(this.timer);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  toggleClick() {
    this.toggle.next('toggleSidebar');
  }
}
