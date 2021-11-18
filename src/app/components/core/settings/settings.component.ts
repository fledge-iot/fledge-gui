import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

import { PingService, SharedService } from '../../../services';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { ServiceDiscoveryComponent } from '../service-discovery';
import { environment } from '../../../../environments/environment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TimezoneService } from '../../../services/timezone.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  @Output() toggle: EventEmitter<any> = new EventEmitter();
  @Input() navbarComponent: NavbarComponent;
  @ViewChild(ServiceDiscoveryComponent, { static: true }) serviceDiscoveryModal: ServiceDiscoveryComponent;

  API_URL = environment.BASE_URL;
  protocol = 'http'; // default protocol
  host;
  servicePort;
  pingInterval: string;
  refreshInterval: string;
  serviceUrl = '';
  selectedTheme: string;
  isServiceUp = false;
  version;
  scheme; // default protocol
  showAlertMessage = false;

  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private pingService: PingService,
    private sharedService: SharedService,
    public timezoneService: TimezoneService) {
    this.protocol = localStorage.getItem('CONNECTED_PROTOCOL') != null ?
      localStorage.getItem('CONNECTED_PROTOCOL') : location.protocol.replace(':', '').trim();
    this.host = localStorage.getItem('CONNECTED_HOST') != null ? localStorage.getItem('CONNECTED_HOST') : location.hostname;
    this.servicePort = localStorage.getItem('CONNECTED_PORT') != null ? localStorage.getItem('CONNECTED_PORT') : 8081;
    // Check whether the service is up or not
    this.sharedService.connectionInfo.subscribe(info => {
      this.isServiceUp = info.isServiceUp;
      this.version = info.version;
      this.scheme = localStorage.getItem('CONNECTED_PROTOCOL') != null ?
        localStorage.getItem('CONNECTED_PROTOCOL') : location.protocol.replace(':', '').trim();
    });
    this.showAlertToContinueWithInsecureCert();
  }

  ngOnInit() {
    this.serviceUrl = sessionStorage.getItem('SERVICE_URL');
    // get last selected time interval
    this.pingInterval = localStorage.getItem('PING_INTERVAL');
    this.refreshInterval = localStorage.getItem('DASHBOARD_GRAPH_REFRESH_INTERVAL');
    this.selectedTheme = localStorage.getItem('OPTED_THEME') != null ? localStorage.getItem('OPTED_THEME') : 'light';
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
      + servicePortField.value + '/fledge/';
    this.showAlertToContinueWithInsecureCert();
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

  /**
   * Set theme for code editor
   */
  public selectTheme(theme: string) {
    this.selectedTheme = theme;
    localStorage.setItem('OPTED_THEME', theme);
    this.sharedService.theme.next(theme);
  }

  public setTimeZone(timezone: string) {
    this.timezoneService.setTimezone(timezone);
  }

  setDashboardRefreshTime(time: string) {
    this.refreshInterval = time;
    localStorage.setItem('DASHBOARD_GRAPH_REFRESH_INTERVAL', time);
    this.pingService.refreshIntervalChanged.next(+time);
  }

  openSSLCertWarningPage() {
    window.open(`${this.API_URL}ping`, '_blank');
  }

  showAlertToContinueWithInsecureCert() {
    this.showAlertMessage = localStorage.getItem('CONNECTED_PROTOCOL') === 'https';
  }

  /**
   * Check client instance is able to ping/connect the server instance for the configured host settings
   */
  canPing() {
    let pingResponse;
    this.pingService.pingResponse
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        pingResponse = res;
      });
    return pingResponse;
  }
}
