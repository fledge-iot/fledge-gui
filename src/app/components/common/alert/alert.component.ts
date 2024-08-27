import { Component, OnInit } from '@angular/core';

import { DARK_ALERTS, AlertService, SharedService } from '../../../services';

@Component({
  selector: 'app-alert',
  templateUrl: 'alert.component.html',
  styleUrls: ['./alert.component.css']
})

export class AlertComponent implements OnInit {
  message: any;
  public darkAlerts = DARK_ALERTS;

  constructor(private alertService: AlertService, private sharedService: SharedService) { }

  ngOnInit() {
    this.alertService.getMessage().subscribe(message => {
      this.message = message;
    });
  }

  /**
   *  Close message
   */
  closeMessage() {
    this.alertService.closeMessage();
  }

  public showLogs(message: string) {
    const link = <HTMLDivElement>document.querySelector('#alert a');
    if (link) {
      const fileLink = message.substring(
        message.lastIndexOf('log/') + 4,
        message.lastIndexOf('</a>')
      );
      this.sharedService.showLogs.next({
        'fileLink': fileLink,
        'isSubscribed': true
      });
    }
  }
}
