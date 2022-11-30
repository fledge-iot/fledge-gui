import { Component, OnInit, HostListener } from '@angular/core';

import { PackagesLogService, ProgressBarService } from '../../../../../services';

@Component({
  selector: 'app-view-logs',
  templateUrl: './view-logs.component.html',
  styleUrls: ['./view-logs.component.css']
})
export class ViewLogsComponent implements OnInit {
  public logText: string;

  constructor(private packagesLogService: PackagesLogService,
    private ngProgress: ProgressBarService) { }

  ngOnInit() {
  }

  public toggleModal(isOpen: Boolean, link: string = null) {
    const view_logs = <HTMLDivElement>document.getElementById('view_logs');
    if (isOpen) {
      this.getLogs(link);
      view_logs.classList.add('is-active');
      return;
    }
    this.logText = '';
    view_logs.classList.remove('is-active');
  }

  public async getLogs(logLink: string): Promise<void> {
    this.ngProgress.start();
    const logContent = await this.packagesLogService.getLog(logLink);
    this.logText = await (new Response(logContent)).text();
    this.ngProgress.done();
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.toggleModal(false);
  }
}
