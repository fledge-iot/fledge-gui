import { Component, OnInit } from '@angular/core';
import { AlertService, SupportService, ProgressBarService } from '../../../services';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css']
})
export class SupportComponent implements OnInit {
  public bundlesData = [];
  constructor(private supportBundleService: SupportService,
    public ngProgress: ProgressBarService,
    private alertService: AlertService) { }

  ngOnInit() {
    this.getBundles();
  }

  public getBundles() {
    this.ngProgress.start();
    this.supportBundleService.get().
      subscribe(
        (data) => {
          this.ngProgress.done();
          this.bundlesData = data['bundles'].sort().reverse();
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
        () => {
          this.ngProgress.done();
          this.alertService.success('Support bundle created successfully');
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

  public async downloadBundle(bundle): Promise<void> {
    const blob = await this.supportBundleService.downloadSupportBundle(bundle);
    const url = window.URL.createObjectURL(blob);
    // create a custom anchor tag
    const a = document.createElement('a');
    a.href = url;
    a.download = bundle;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

