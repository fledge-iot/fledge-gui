import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgProgress } from 'ngx-progressbar';

import { ServicesHealthService } from '../../../services';
import { AlertService } from '../../../services/alert.service';
import { SouthServiceModalComponent } from './south-service-modal/south-service-modal.component';

@Component({
  selector: 'app-south',
  templateUrl: './south.component.html',
  styleUrls: ['./south.component.css']
})
export class SouthComponent implements OnInit {
  public services = [];
  public service;
  public pluginsAsset = [];
  public assets = [];
  public schedules = [];
  public southPluginsRecord = [];

  @ViewChild(SouthServiceModalComponent) southServiceModal: SouthServiceModalComponent;

  constructor(private servicesHealthService: ServicesHealthService,
    private alertService: AlertService,
    public ngProgress: NgProgress,
    private router: Router) { }

  ngOnInit() {
    this.getInstalledSouthPluginData();
  }

  public getInstalledSouthPluginData() {
    /** request started */
    this.ngProgress.start();
    this.servicesHealthService.getSouthPluginData().
      subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          this.southPluginsRecord = data['services'];
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  addSouthService() {
    this.router.navigate(['/south/add']);
  }

  /**
 * Open create scheduler modal dialog
 */
  openSouthServiceModal(service) {
    this.service = service;
    this.southServiceModal.toggleModal(true);
  }

  onNotify() {
    this.getInstalledSouthPluginData();
  }
}
