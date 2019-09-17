import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

import { PingService } from '../../../services';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { ServiceDiscoveryComponent } from '../service-discovery';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  @Output() toggle: EventEmitter<any> = new EventEmitter();
  @Input() navbarComponent: NavbarComponent;
  @ViewChild(ServiceDiscoveryComponent, { static: true }) serviceDiscoveryModal: ServiceDiscoveryComponent;

  protocol = 'http'; // default protocol
  host;
  servicePort;
  pingInterval: string;
  refreshInterval: string;
  serviceUrl = '';

  constructor(private pingService: PingService) {
    this.protocol = localStorage.getItem('CONNECTED_PROTOCOL') != null ?
      localStorage.getItem('CONNECTED_PROTOCOL') : location.protocol.replace(':', '').trim();
    this.host = localStorage.getItem('CONNECTED_HOST') != null ? localStorage.getItem('CONNECTED_HOST') : location.hostname;
    this.servicePort = localStorage.getItem('CONNECTED_PORT') != null ? localStorage.getItem('CONNECTED_PORT') : 8081;
  }

  ngOnInit() {
    this.serviceUrl = sessionStorage.getItem('SERVICE_URL');
    // get last selected time interval
    this.pingInterval = localStorage.getItem('PING_INTERVAL');
    this.refreshInterval = localStorage.getItem('DASHBOARD_GRAPH_REFRESH_INTERVAL');
  }

  public testServiceConnection(): void {
    this.setServiceUrl();
    console.log(this.serviceUrl);
    window.open(this.serviceUrl + 'ping', '_blank');
  }

  public openServiceDiscoveryModal() {
    // call child component method to toggle modal
    this.serviceDiscoveryModal.toggleModal(true);
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

  setProtocol(httpProtocol: string) {
    this.protocol = httpProtocol;
  }

  protected setServiceUrl() {
    const hostField = <HTMLInputElement>document.getElementById('host');
    const servicePortField = <HTMLInputElement>document.getElementById('service_port');
    localStorage.setItem('CONNECTED_PROTOCOL', this.protocol);
    localStorage.setItem('CONNECTED_HOST', hostField.value);
    localStorage.setItem('CONNECTED_PORT', servicePortField.value);
    this.serviceUrl = this.protocol + '://' + hostField.value + ':'
      + servicePortField.value + '/foglamp/';
  }

  public resetEndPoint() {
    this.setServiceUrl();
    localStorage.setItem('SERVICE_URL', this.serviceUrl);
    this.reloadApp();
  }

  public reloadApp() {
    location.reload();
  }

  /**
   * Set service ping interval
   */
  public ping(time: string) {
    this.pingInterval = time;
    localStorage.setItem('PING_INTERVAL', time);
    this.pingService.pingIntervalChanged.next(+time);
  }

  setDashboardRefreshTime(time: string) {
    this.refreshInterval = time;
    localStorage.setItem('DASHBOARD_GRAPH_REFRESH_INTERVAL', time);
    this.pingService.refreshIntervalChanged.next(+time);
  }
}
