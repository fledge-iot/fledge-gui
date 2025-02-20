import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

import { PingService, RolesService, SharedService } from '../../../services';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { ServiceDiscoveryComponent } from '../service-discovery';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TimezoneService } from '../../../services/timezone.service';
import { RangeSliderService } from '../../common/range-slider/range-slider.service';
import { DeveloperFeaturesService } from '../../../services/developer-features.service';
import { StorageService } from '../../../services/storage.service';
import { DEBOUNCE_TIME } from '../../../utils';
import { FlowEditorService } from '../../common/node-editor/flow-editor.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
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
  selectedTheme: string;
  isServiceUp = false;
  version;
  scheme; // default protocol
  showAlertMessage = false;
  destroy$: Subject<boolean> = new Subject<boolean>();
  selectedUnit: string = 'minutes';
  readingsGraphUnit = ['seconds', 'minutes', 'hours'];
  @ViewChild('readings_graph_default_time', { static: true }) readings_graph_default_time: ElementRef;
  private fromEventSub: Subscription;

  constructor(private pingService: PingService,
    private sharedService: SharedService,
    public rangeSliderService: RangeSliderService,
    public developerFeaturesService: DeveloperFeaturesService,
    public storageService: StorageService,
    public timezoneService: TimezoneService,
    public rolesService: RolesService,
    public flowEditorService: FlowEditorService) {
    this.protocol = this.storageService.getProtocol() != null ? this.storageService.getProtocol() : location.protocol.replace(':', '').trim();
    this.host = this.storageService.getHost() != null ? this.storageService.getHost() : location.hostname;
    this.servicePort = this.storageService.getPort() != null ? this.storageService.getPort() : 8081;
    localStorage.getItem('FLOW_EDITOR') != null ? this.flowEditorService.getFlowEditorStatus() : this.flowEditorService.flowEditorControl(true);

    // Check whether the service is up or not
    this.sharedService.connectionInfo.subscribe(info => {
      this.isServiceUp = info.isServiceUp;
      this.version = info.version;
      this.scheme = this.storageService.getProtocol() != null ? this.storageService.getProtocol() : location.protocol.replace(':', '').trim();
    });
    this.showAlertToContinueWithInsecureCert();
  }

  ngOnInit() {
    this.readings_graph_default_time.nativeElement.value = 10;
    this.serviceUrl = this.storageService.getServiceURL();
    // get last selected time interval
    this.pingInterval = localStorage.getItem('PING_INTERVAL');
    this.refreshInterval = localStorage.getItem('DASHBOARD_GRAPH_REFRESH_INTERVAL');
    this.selectedTheme = localStorage.getItem('OPTED_THEME') != null ? localStorage.getItem('OPTED_THEME') : 'light';
    let rGraphDefaultDuration = localStorage.getItem('READINGS_GRAPH_DEFAULT_DURATION');
    this.readings_graph_default_time.nativeElement.value = rGraphDefaultDuration !== null ? parseInt(rGraphDefaultDuration) : 10;
    let rGraphDefaultUnit = localStorage.getItem('READINGS_GRAPH_DEFAULT_UNIT');
    this.selectedUnit = rGraphDefaultUnit !== null ? rGraphDefaultUnit : 'minutes';

    this.fromEventSub = fromEvent(this.readings_graph_default_time.nativeElement, 'input')
      .pipe(distinctUntilChanged(), debounceTime(DEBOUNCE_TIME))
      .subscribe(() => {
        if (this.readings_graph_default_time.nativeElement.value !== '') {
          let time = this.applyTimeValidation();
          localStorage.setItem('READINGS_GRAPH_DEFAULT_DURATION', time);
          localStorage.setItem('READINGS_GRAPH_DEFAULT_UNIT', this.selectedUnit);
        }
      })
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
    this.storageService.setProtocol(this.protocol);
    this.storageService.setHost(hostField.value);
    this.storageService.setPort(servicePortField.value);
    this.serviceUrl = this.protocol + '://' + hostField.value + ':'
      + servicePortField.value + '/fledge/';
    this.showAlertToContinueWithInsecureCert();
  }

  public resetEndPoint() {
    this.setServiceUrl();
    this.storageService.setServiceURL(this.serviceUrl);
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

  setDeveloperFeatures(devStatus: boolean) {
    this.developerFeaturesService.setDeveloperFeatureControl(devStatus);
  }

  setAlphControlStatus(status: boolean) {
    this.rangeSliderService.alphaControl(status);
  }

  setFlowEditorStatus(status: boolean) {
    this.flowEditorService.flowEditorControl(status);
  }

  openSSLCertWarningPage() {
    window.open(`${this.serviceUrl}ping`, '_blank');
  }

  showAlertToContinueWithInsecureCert() {
    this.showAlertMessage = this.storageService.getProtocol() === 'https';
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

  getMaxTimeForReadings() {
    if (this.selectedUnit === 'seconds') {
      return 3 * 60 * 60;
    }
    if (this.selectedUnit === 'minutes') {
      return 3 * 60;
    }
    return 3;
  }

  applyTimeValidation() {
    let value = this.readings_graph_default_time.nativeElement.value;
    if (value > this.getMaxTimeForReadings() || value === '0' || value === '') {
      this.readings_graph_default_time.nativeElement.value = 1;
      return 1;
    }
    return value;
  }

  setReadingsGraphDefaultUnit(unit: string) {
    this.selectedUnit = unit;
    let time = this.applyTimeValidation();
    localStorage.setItem('READINGS_GRAPH_DEFAULT_DURATION', time);
    localStorage.setItem('READINGS_GRAPH_DEFAULT_UNIT', unit);
    this.toggleDropDown('readings-graph-default-duration');
  }
}
