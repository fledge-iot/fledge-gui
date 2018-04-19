import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertService, DiscoveryService, PingService } from '../services/index';
import { Router } from '@angular/router';
import { ConnectedServiceStatus } from '../services/connected-service-status.service';
import { POLLING_INTERVAL } from '../utils';
@Component({
  selector: 'app-service-discovery',
  templateUrl: './service-discovery.component.html',
  styleUrls: ['./service-discovery.component.css']
})
export class ServiceDiscoveryComponent implements OnInit, OnDestroy {
  discoveredServices = [];
  connectedServiceStatus = false;
  discoveryServiceStatus = false;
  isLoading = false;
  discoveryURL;
  message = '';
  host = 'localhost';  // default
  port = '3000'; // default
  connectedService: any;
  public JSON;
  public timer: any = '';

  constructor(private discoveryService: DiscoveryService, private router: Router,
    private status: ConnectedServiceStatus,
    private alertService: AlertService) {
    this.JSON = JSON;
  }

  ngOnInit() {
    this.connectedService = JSON.parse(localStorage.getItem('CONNECTED_SERVICE'));
    this.status.currentMessage.subscribe(status => {
      this.connectedServiceStatus = status;
      if (this.discoveryURL != null && !this.connectedServiceStatus) {
        this.message = 'Connected service is down. Connect to other service listed below or ' +
          'you can connect a service manually from settings.';
      }
    });
  }

  public toggleModal(isOpen: Boolean) {
    const serviceDiscoveryModal = <HTMLDivElement>document.getElementById('service_discovery_modal');
    if (isOpen) {
      serviceDiscoveryModal.classList.add('is-active');
      return;
    }
    serviceDiscoveryModal.classList.remove('is-active');
  }

  setServiceDiscoveryURL() {
    this.isLoading = true;
    const protocolField = <HTMLSelectElement>document.getElementById('discovery_protocol');
    const hostField = <HTMLInputElement>document.getElementById('discovery_host');
    const servicePortField = <HTMLInputElement>document.getElementById('discovery_port');
    this.discoveryURL = protocolField.value + '://' + hostField.value + ':' + servicePortField.value + '/foglamp/discover';
    localStorage.setItem('DISCOVERY_SERVICE_URL', this.discoveryURL);
    this.start(POLLING_INTERVAL);
  }

  discoverService() {
    const serviceDiscoveryUrl = localStorage.getItem('DISCOVERY_SERVICE_URL');
    const serviceRecord = [];
    this.discoveryService.discover(serviceDiscoveryUrl)
      .subscribe(
        (data) => {
          this.isLoading = false;
          this.discoveryServiceStatus = true;
          Object.keys(data).forEach(function (key) {
            serviceRecord.push({
              key: key,
              [key]: data[key],
              'port': 8081
            });
          });
          this.discoveredServices = serviceRecord;
        },
        (error) => {
          console.log('error');
          this.discoveryServiceStatus = false;
          this.discoveredServices = [];
          if (error.status === 0) {
            this.message = 'Not able to connect. Please check service discovery server is up and running.';
            console.log('service down ', error);
          } else {
            console.log('error in response ', error);
          }
        });
  }

  connectService(service) {
    this.connectedService = service;
    localStorage.setItem('CONNECTED_SERVICE', JSON.stringify(service));
    const address = service[service.key].addresses.length > 1 ? service[service.key].addresses[1] : service[service.key].addresses[0];
    // TODO: Get protocol from service discovery
    const serviceEndpoint = 'http://' + address + ':' + '8081/foglamp/';
    localStorage.setItem('PROTOCOL', 'http');
    localStorage.setItem('HOST', address);
    localStorage.setItem('PORT', '8081');
    localStorage.setItem('SERVICE_URL', serviceEndpoint);
    location.reload();
    location.href = '';
    this.router.navigate([location.href]);
  }

  public closeMessage() {
    const message_window = <HTMLDivElement>document.getElementById('warning');
    message_window.classList.add('hidden');
  }

  public start(pingInterval) {
    this.stop();
    this.timer = setInterval(function () {
      this.discoverService();
    }.bind(this), pingInterval);
  }

  public stop() {
    clearInterval(this.timer);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }
}
