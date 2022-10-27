import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  setServiceURL(serviceUrl: string) {
    localStorage.setItem('SERVICE_URL', serviceUrl);
  }

  getServiceURL() {
    return localStorage.getItem('SERVICE_URL');
  }

  setProtocol(protocol: string) {
    localStorage.setItem('CONNECTED_PROTOCOL', protocol);
  }

  getProtocol() {
    return localStorage.getItem('CONNECTED_PROTOCOL');
  }

  setHost(host: string) {
    localStorage.setItem('CONNECTED_HOST', host);
  }

  getHost() {
    return localStorage.getItem('CONNECTED_HOST');
  }

  setPort(port: string) {
    localStorage.setItem('CONNECTED_PORT', port);
  }

  getPort() {
    return localStorage.getItem('CONNECTED_PORT');
  }
}
