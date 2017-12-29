import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

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
  service_port = this.endpoint[2].substring(0, this.endpoint[2].indexOf('/'));
  management_port = 0;
  constructor(private router: Router) { }

  ngOnInit() {
    if (environment.MANAGEMENT_URL !== '') {
      const url_items = environment.MANAGEMENT_URL.split(':');
      this.management_port = +url_items[2].substring(0, url_items[2].indexOf('/'));
    }
  }

  public resetEndPoint() {
    const protocolField = <HTMLSelectElement>document.getElementById('protocol');
    const hostField = <HTMLInputElement>document.getElementById('host');
    const servicePortField = <HTMLInputElement>document.getElementById('service_port');
    const managementPortField = <HTMLInputElement>document.getElementById('management_port');
    const service_endpoint = protocolField.value + '://' + hostField.value + ':' + servicePortField.value + '/foglamp/';
    localStorage.setItem('SERVICE_URL', service_endpoint);

    if (managementPortField.value !== '') {
      // TODO make sure its a positive integer too
      const management_endpoint = protocolField.value + '://' + hostField.value + ':' + managementPortField.value + '/foglamp/';
      localStorage.setItem('MANAGEMENT_URL', management_endpoint);
    }
    location.reload();
    location.href = '';
    this.router.navigate([location.href]);
  }
}
