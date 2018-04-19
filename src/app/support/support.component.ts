import { Component, OnInit } from '@angular/core';
import { SupportService, AlertService } from '../services/index';
import { NgProgress } from 'ngx-progressbar';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css']
})
export class SupportComponent implements OnInit {
  public bundlesData = [];
  public supportUrl = this.supportBundleService.SUPPORT_BUNDLE_URL;

  constructor(private supportBundleService: SupportService, public ngProgress: NgProgress, private alertService: AlertService) { }


  ngOnInit() {
    this.getBundles();
  }

  public getBundles() {
    this.ngProgress.start();
    this.supportBundleService.get().
      subscribe(
        data => {
          this.ngProgress.done();
          this.bundlesData = data.bundles.sort().reverse();
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public requestNewBundle() {
    this.ngProgress.start();
    this.supportBundleService.post().
      subscribe(
        data => {
          this.ngProgress.done();
          this.alertService.success("Support bundle created successfully");
          this.getBundles();
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

}

