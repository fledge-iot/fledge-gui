import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AlertService, DiscoveryService } from '../services/index';
import { Router } from '@angular/router';
import { ConnectedServiceStatus } from "../services/connected-service-status.service";

@Component({
  selector: 'app-service-discovery',
  inputs: ['serviceStatus'],
  templateUrl: './service-discovery.component.html',
  styleUrls: ['./service-discovery.component.css']
})
export class ServiceDiscoveryComponent implements OnInit, AfterViewInit {
  discoveredServices = [];
  isConnected = false;
  connectedButtonId: string;
  connectedServiceStatus: boolean;
  discoveryServiceStatus: boolean = true;
  message: string = '';
  host = "localhost";  // default 
  port = "3000"; // default 

  constructor(private discoveryService: DiscoveryService, private router: Router, private status: ConnectedServiceStatus,
    private alertService: AlertService) { }

  ngOnInit() {
    this.status.currentMessage.subscribe(status => {
      this.connectedServiceStatus = status;
      if (!status && this.discoveredServices.length == 0) {
        this.message = 'Connected service is down. You can connect a service manually from <a href="/setting">settings</a>.'
      } else if (!status && this.discoveredServices.length != 0) {
        this.message = 'Connected service is down. Connect to other service listed below or you can connect a service manually from <a href="/setting">settings</a>.'
      }
      this.discoverService();
    })
  }

  ngAfterViewInit() {
    this.isConnected = JSON.parse(localStorage.getItem('CONNECTED_SERVICE_STATE'));
    this.connectedButtonId = localStorage.getItem('CONNECTED_SERVICE_ID');
  }

  setServiceDiscoveryURL() {
    const protocolField = <HTMLSelectElement>document.getElementById('protocol');
    const hostField = <HTMLInputElement>document.getElementById('host');
    const servicePortField = <HTMLInputElement>document.getElementById('port');
    const discoveryServiceEndpoint = protocolField.value + '://' + hostField.value + ':' + servicePortField.value + '/foglamp/discover';
    localStorage.setItem('DISCOVERY_SERVICE_URL', discoveryServiceEndpoint);
    this.alertService.success('Discovery service url configured successfully.');
  }

  discoverService() {
    let serviceRecord = [];
    this.discoveryService.discover()
      .subscribe(
      (data) => {
        this.discoveryServiceStatus = true;
        Object.keys(data).forEach(function (key) {
          serviceRecord.push({
            key: key,
            [key]: data[key]
          })
        });
        this.discoveredServices = serviceRecord;

        for (let service of this.discoveredServices) {
          const address = service[service.key].addresses.length > 1 ? service[service.key].addresses[1] : service[service.key].addresses[0];
          const port = service[service.key].port;
          if (address === localStorage.getItem('CONNECTED_HOST') && port === +localStorage.getItem('MANAGEMENT_PORT')) {
            this.isConnected = true;
            this.connectedButtonId = service.key;
            localStorage.setItem('CONNECTED_SERVICE_STATE', JSON.stringify(this.isConnected));
            localStorage.setItem('CONNECTED_SERVICE_ID', this.connectedButtonId);
          }
        }
      },
      (error) => {
        this.discoveryServiceStatus = false;
        this.discoveredServices = [];
        if (error.status === 0) {
          this.message = 'Not able to connect. Please check service discovery server is up and running.'
          console.log('service down ', error);
        } else {
          this.message = "Something wrong with the discovery service. Try again!"
          console.log('error in response ', error);
        }
      });
  }

  connectService(service) {
    this.connectedButtonId = service.key;
    this.isConnected = true;
    localStorage.setItem('CONNECTED_SERVICE_STATE', JSON.stringify(this.isConnected));
    localStorage.setItem('CONNECTED_SERVICE_ID', this.connectedButtonId);

    let port = service[service.key].port
    let address = service[service.key].addresses.length > 1 ? service[service.key].addresses[1] : service[service.key].addresses[0];

    // TODO: Get protocol from service discovery
    const serviceEndpoint = 'http://' + address + ':' + '8081/foglamp/';
    const managementEndpoint = 'http://' + address + ':' + port + '/foglamp/';

    localStorage.setItem('SERVICE_URL', serviceEndpoint);
    localStorage.setItem('MANAGEMENT_URL', managementEndpoint);
    location.reload();
    location.href = '';
    this.router.navigate([location.href]);
  }

  public closeMessage() {
    let message_window = <HTMLDivElement>document.getElementById('warning');
    message_window.classList.add('hidden');
  }
}
