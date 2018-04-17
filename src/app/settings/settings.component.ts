import { Component, OnInit, Input, Output, EventEmitter, NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { PingService } from './../services/index';
import { NavbarComponent } from '../navbar/navbar.component';
import { PlatformLocation } from '@angular/common';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  @Output() toggle: EventEmitter<any> = new EventEmitter();
  protocol;
  host;
  servicePort;
  isSkipped = false;
  serviceUrl = '';
  @Input() navbarComponent: NavbarComponent;
  pingInterval;
  constructor(private router: Router, private pingService: PingService,
    private platformLocation: PlatformLocation) {
    this.protocol = localStorage.getItem('PROTOCOL') != null ? localStorage.getItem('PROTOCOL') : location.protocol;
    this.host = localStorage.getItem('HOST') != null ? localStorage.getItem('HOST') : location.hostname;
    this.servicePort = localStorage.getItem('PORT') != null ? localStorage.getItem('PORT') : 8081;
  }

  ngOnInit() {
    this.isSkipped = JSON.parse(sessionStorage.getItem('skip'));
    this.serviceUrl = sessionStorage.getItem('SERVICE_URL');
    // get last selected time interval
    this.pingInterval = localStorage.getItem('pingInterval');
  }

  public testServiceConnection(): void {
    this.setServiceUrl();
    console.log(this.serviceUrl);
    window.open(this.serviceUrl + 'ping', '_blank');
  }

  public serviceDiscovery() {
    this.router.navigate(['/service-discovery']);
  }

  protected setServiceUrl() {
    const protocolField = <HTMLSelectElement>document.getElementById('protocol');
    const hostField = <HTMLInputElement>document.getElementById('host');
    const servicePortField = <HTMLInputElement>document.getElementById('service_port');
    localStorage.setItem('PROTOCOL', protocolField.value);
    localStorage.setItem('HOST', hostField.value);
    localStorage.setItem('PORT', servicePortField.value);
    this.serviceUrl = protocolField.value + '//' + hostField.value + ':'
      + servicePortField.value + '/foglamp/';
  }

  public resetEndPoint() {
    this.setServiceUrl();
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
    this.pingService.pingIntervalChanged.next(+time);
  }
}
