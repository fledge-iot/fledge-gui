import { Component, OnInit, HostListener } from '@angular/core';
import { UntypedFormBuilder, Validators, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { DiscoveryService } from '../../../services';
import { ConnectedServiceStatus } from '../../../services/connected-service-status.service';

@Component({
  selector: 'app-service-discovery',
  templateUrl: './service-discovery.component.html',
  styleUrls: ['./service-discovery.component.css']
})
export class ServiceDiscoveryComponent implements OnInit {
  discoveredServices = [];
  connectedServiceStatus = false;
  discoveryServiceStatus = false;
  isLoading = false;
  message = '';
  discoveryProtocol;
  discoveryHost;
  discoveryPort;
  public JSON;
  public timer: any = '';
  connectedProtocol;
  connectedHost;
  connectedPort;
  form: UntypedFormGroup;
  constructor(private discoveryService: DiscoveryService, private router: Router,
    public fb: UntypedFormBuilder, private status: ConnectedServiceStatus) {
    this.JSON = JSON;
    this.discoveryHost = localStorage.getItem('DISCOVERY_HOST') != null ? localStorage.getItem('DISCOVERY_HOST') : 'localhost';
    this.discoveryPort = localStorage.getItem('DISCOVERY_PORT') != null ? localStorage.getItem('DISCOVERY_PORT') : '3000';
  }

  ngOnInit() {
    this.form = this.fb.group({
      discoveryHostControl: ['', Validators.required],
      discoveryPortControl: ['', Validators.required],
      discoveryProtocol: [localStorage.getItem('DISCOVERY_PROTOCOL') != null ?
                         localStorage.getItem('DISCOVERY_PROTOCOL') : 'http', Validators.required]
    });
    this.connectedProtocol = localStorage.getItem('CONNECTED_PROTOCOL');
    this.connectedHost = localStorage.getItem('CONNECTED_HOST');
    this.connectedPort = localStorage.getItem('CONNECTED_PORT');
    this.status.currentMessage.subscribe(status => {
      this.connectedServiceStatus = status;
    });
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.toggleModal(false);
  }

  public toggleModal(isOpen: Boolean) {
    this.isLoading = false;
    const serviceDiscoveryModal = <HTMLDivElement>document.getElementById('service_discovery_modal');
    if (isOpen) {
      serviceDiscoveryModal.classList.add('is-active');
      return;
    }
    serviceDiscoveryModal.classList.remove('is-active');
  }

  setServiceDiscoveryURL() {
    this.isLoading = true;
    const protocolField = this.form.get('discoveryProtocol').value;
    const hostField = this.form.get('discoveryHostControl').value;
    const servicePortField = this.form.get('discoveryPortControl').value;
    const discoveryURL = protocolField + '://' + hostField.trim()
      + ':' + servicePortField + '/fledge/discover';
    localStorage.setItem('DISCOVERY_PROTOCOL', protocolField);
    localStorage.setItem('DISCOVERY_HOST', hostField);
    localStorage.setItem('DISCOVERY_PORT', servicePortField);
    this.discoverService(discoveryURL);
  }

  discoverService(discoveryURL) {
    const serviceRecord = [];
    this.discoveryService.discover(discoveryURL)
      .subscribe(
        (data) => {
          this.isLoading = false;
          this.discoveryServiceStatus = true;
          Object.keys(data).forEach(function (key) {
            serviceRecord.push({
              key: key,
              'protocol': 'http',
              'address': data[key].addresses.length > 1 ? data[key].addresses[1] : data[key].addresses[0],
              'port': 8081
            });
          });
          this.discoveredServices = serviceRecord;
          if (this.discoveredServices.length <= 0) {
            this.discoveryServiceStatus = false;
            this.message = 'No running Fledge instance found over the network.';
            this.toggleMessage(false);
          } else if (!this.connectedServiceStatus) {
            this.message = 'Connected service is down. Connect to other service listed below, or ' +
              'You can connect to a service manually from settings.';
            this.toggleMessage(false);
          }
        },
        (error) => {
          this.isLoading = false;
          this.discoveryServiceStatus = false;
          this.discoveredServices = [];
          if (error.status === 0) {
            this.message = 'Not able to connect. Please check service discovery server is up and running.';
            this.toggleMessage(false);
            console.log('service down ', error);
          } else {
            console.log('error in response ', error);
          }
        });
  }

  connectService(service) {
    // TODO: Get protocol from service discovery
    const serviceEndpoint = service.protocol + '://' + service.address + ':' + service.port + '/fledge/';
    localStorage.setItem('CONNECTED_PROTOCOL', service.protocol);
    localStorage.setItem('CONNECTED_HOST', service.address);
    localStorage.setItem('CONNECTED_PORT', service.port);
    localStorage.setItem('SERVICE_URL', serviceEndpoint);
    location.reload();
    location.href = '';
    this.router.navigate([location.href]);
  }

  public toggleMessage(isOpen) {
    this.isLoading = false;
    const message_window = <HTMLDivElement>document.getElementById('warning');
    if (message_window != null) {
      if (isOpen) {
        message_window.classList.add('hidden');
        return;
      }
      message_window.classList.remove('hidden');
    }
  }

  isServiceConnected(service) {
    if (this.connectedHost === service.address &&
      this.connectedPort === JSON.stringify(service.port)
      && this.connectedProtocol === service.protocol) {
      return true;
    } else if (this.connectedHost !== service.address ||
      this.connectedPort !== JSON.stringify(service.port) ||
      this.connectedProtocol !== service.protocol) {
      return false;
    }
  }
}
