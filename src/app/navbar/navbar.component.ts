import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';

import { ServicesHealthService } from '../services/index';

import { POLLING_INTERVAL } from '../utils';

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
  constructor(private servicesHealthService: ServicesHealthService) { }
  ngOnInit() {
    this.start();
  }

  pingService() {
    // console.log("pingService ...")
    this.servicesHealthService.pingService()
      .subscribe(
      (data) => {
        this.ping_data = data;
        this.ping_info = { is_alive: true, service_status: 'running...' };
      },
      (error) => {
        console.log('error: ', error);
        this.ping_info = { is_alive: false, service_status: 'service down' };
      },
      // () => console.log(this.ping_info)
    );
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
