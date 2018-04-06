import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { PingService } from './../services/index';
import { POLLING_INTERVAL } from '../utils';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  @Output() toggle: EventEmitter<any> = new EventEmitter();
  endpoint = environment.BASE_URL.split(':');
  protocol = this.endpoint[0];
  host = this.endpoint[1].substr(2);
  servicePort = this.endpoint[2].substring(0, this.endpoint[2].indexOf('/'));
  isSkipped = false;
  serviceUrl = '';
  @Input() navbarComponent: NavbarComponent;
  pingInterval;
  constructor(private router: Router, private pingService: PingService) { }

  ngOnInit() {
    this.isSkipped = JSON.parse(sessionStorage.getItem('skip'));
    this.serviceUrl = sessionStorage.getItem('SERVICE_URL');
    // get last selected time interval
    this.pingInterval = localStorage.getItem('pingInterval');
  }

  public testServiceConnection(): void {
    this.getServiceUrl();
    console.log(this.serviceUrl);
    window.open(this.serviceUrl + 'ping', '_blank');
  }

  protected getServiceUrl() {
    const protocolField = <HTMLSelectElement>document.getElementById('protocol');
    const hostField = <HTMLInputElement>document.getElementById('host');
    const servicePortField = <HTMLInputElement>document.getElementById('service_port');
    localStorage.setItem('CONNECTED_HOST', hostField.value);
    localStorage.setItem('CONNECTED_PORT', servicePortField.value);
    this.serviceUrl = protocolField.value + '://' + hostField.value + ':' + servicePortField.value + '/foglamp/';
  }

  public resetEndPoint() {
    this.getServiceUrl();

    localStorage.setItem('SERVICE_URL', this.serviceUrl);

    // Clear connected service if any
    localStorage.removeItem('CONNECTED_SERVICE_STATE');
    localStorage.removeItem('CONNECTED_SERVICE_ID');
    this.reloadApp();
  }

  public reloadApp() {
    location.reload();
    location.href = '';
    this.router.navigate([location.href]);
  }

  /**
   * Set service ping interval
   */
  public ping(event) {
    const time = event.target.value;
    localStorage.setItem('pingInterval', time);
    this.pingService.isPingIntervalChanged.next(true);
  }
}
