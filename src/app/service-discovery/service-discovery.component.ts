import { Component, OnInit } from '@angular/core';
import { AlertService, DiscoveryService } from '../services/index';
import { Router } from '@angular/router';
import { ConnectedServiceStatus } from '../services/connected-service-status.service';

@Component({
  selector: 'app-service-discovery',
  templateUrl: './service-discovery.component.html',
  styleUrls: ['./service-discovery.component.css']
})
export class ServiceDiscoveryComponent implements OnInit {
  discoveredServices = [];
  connectedServiceStatus: boolean;
  discoveryServiceStatus = true;
  message = '';
  host = 'localhost';  // default
  port = '3000'; // default
  connectedService: any;
  public JSON;

  constructor(private discoveryService: DiscoveryService, private router: Router,
    private status: ConnectedServiceStatus,
    private alertService: AlertService) {
    this.JSON = JSON;
  }

  ngOnInit() {
    this.connectedService = JSON.parse(localStorage.getItem('CONNECTED_SERVICE'));
    this.status.currentMessage.subscribe(status => {
      this.connectedServiceStatus = status;
      console.log('status', status);
      if (!status && this.discoveredServices.length === 0) {
        this.message = 'Connected service is down. You can connect a service manually from <a href="/setting">settings</a>.';
      } else if (!status && this.discoveredServices.length !== 0) {
        this.message = 'Connected service is down. Connect to other service listed below or ' +
          'you can connect a service manually from <a href="/setting">settings</a>.';
      }
      this.discoverService();
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
    const protocolField = <HTMLSelectElement>document.getElementById('discovery_protocol');
    const hostField = <HTMLInputElement>document.getElementById('discovery_host');
    const servicePortField = <HTMLInputElement>document.getElementById('discovery_port');
    const discoveryServiceEndpoint = protocolField.value + '://' + hostField.value + ':' + servicePortField.value + '/foglamp/discover';
    localStorage.setItem('DISCOVERY_SERVICE_URL', discoveryServiceEndpoint);
    this.alertService.success('Discovery service url configured successfully.');
  }

  discoverService() {
    const serviceRecord = [];
    this.discoveryService.discover()
      .subscribe(
        (data) => {
          this.discoveryServiceStatus = true;
          Object.keys(data).forEach(function (key) {
            serviceRecord.push({
              key: key,
              [key]: data[key]
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
    localStorage.setItem('SERVICE_URL', serviceEndpoint);
    location.reload();
    location.href = '';
    this.router.navigate([location.href]);
  }

  public closeMessage() {
    const message_window = <HTMLDivElement>document.getElementById('warning');
    message_window.classList.add('hidden');
  }
}
