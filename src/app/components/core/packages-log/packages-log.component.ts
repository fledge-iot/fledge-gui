import { Component, OnInit } from '@angular/core';
import { AlertService, PackagesLogService, ProgressBarService } from '../../../services';
import { sortBy } from 'lodash';

@Component({
  selector: 'app-packages-log',
  templateUrl: './packages-log.component.html',
  styleUrls: ['./packages-log.component.css']
})
export class PackagesLogComponent implements OnInit {
  public logList = [];
  public logContent;

  constructor(private packagesLogService: PackagesLogService,
    private ngProgress: ProgressBarService,
    private alertService: AlertService) { }

  ngOnInit() {
    this.getPackagesLog();
  }

  public getPackagesLog() {
    /** request start */
    this.ngProgress.start();
    this.packagesLogService.getPackageLogs().
    subscribe(
      (data) => {
        this.ngProgress.done();
        this.logList = sortBy(data['logs'], function (obj) {
          return obj.timestamp;
        }).reverse();
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

  public async showLogs(logLink): Promise<void> {
    const logContent = await this.packagesLogService.getLog(logLink);
    const file = new Blob([logContent], {type: 'text/plain'});
    const url = window.URL.createObjectURL(file);
    const tab = window.open();
    tab.location.href = url;
  }

  public async downloadLogs(logLink): Promise<void> {
    const blob = await this.packagesLogService.getLog(logLink);
    const url = window.URL.createObjectURL(blob);
    // create a custom anchor tag
    const a = document.createElement('a');
    a.href = url;
    a.download = logLink;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

}
