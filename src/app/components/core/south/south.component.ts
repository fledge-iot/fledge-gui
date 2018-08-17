import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgProgress } from 'ngx-progressbar';

import { ServicesHealthService, AssetsService } from '../../../services';
import { AlertService } from '../../../services/alert.service';
import { SouthServiceModalComponent } from './south-service-modal/south-service-modal.component';

@Component({
  selector: 'app-south',
  templateUrl: './south.component.html',
  styleUrls: ['./south.component.css']
})
export class SouthComponent implements OnInit {
  public services = [];
  public service: string;
  public pluginsAsset = [];
  public assets = [];

  @ViewChild(SouthServiceModalComponent) southServiceModal: SouthServiceModalComponent;

  constructor(private servicesHealthService: ServicesHealthService,
    private alertService: AlertService,
    public ngProgress: NgProgress, private assetsService: AssetsService,
    private router: Router) { }

  ngOnInit() {
    this.getServiceData();
    this.getAssets();
  }

  public getAssets(): void {
    this.assetsService.getAsset().
      subscribe(
        (data: any[]) => {
          this.assets = data;
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }


  public getServiceData() {
    /** request start */
    this.ngProgress.start();
    this.servicesHealthService.getAllServices()
      .subscribe(
        (data) => {
          if (data['error']) {
            console.log('error in response', data['error']);
            this.alertService.warning('Could not connect to API');
            return;
          }
          this.services = data['services'];
          this.services = this.services.filter((item) => item.type === 'Southbound');
          /** request completed */
          this.ngProgress.done();
          this.services.forEach(service => {
            this.getInstalledPluginsAsset(service.name);
          });
        },
        (error) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.warning('Could not connect to API');
          console.log('error: ', error);
        });
  }

  addSouthService() {
    this.router.navigate(['/south/add']);
  }

  getInstalledPluginsAsset(serviceName) {
    /** request start */
    this.ngProgress.start();
    this.servicesHealthService.getInstalledPluginAsset(serviceName)
      .subscribe(
        (data: any) => {
          const assetsData = [];
          const readingsData = [];
          const track = data['track'];
          track.forEach(t => {
            assetsData.push(t.asset);
          });

          assetsData.forEach(at => {
            const matchedAsset = this.assets.find(a => a.assetCode === at);
            readingsData.push({ asset: at, readings: matchedAsset.count });
          });

          this.services.forEach(service => {
            if (service.name === serviceName) {
              service.readings = readingsData;
            }
          });
          /** request completed */
          this.ngProgress.done();
        },
        (error) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.warning('Could not connect to API');
          console.log('error: ', error);
        });
  }

  /**
 * Open create scheduler modal dialog
 */
  openSouthServiceModal(service) {
    this.service = service;
    // call child component method to toggle modal
    this.southServiceModal.toggleModal(true);
  }
}
