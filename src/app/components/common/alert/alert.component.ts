import { Component, OnInit } from '@angular/core';

import { DARK_ALERTS, AlertService } from '../../../services';

@Component({
    moduleId: module.id.toString(),
    selector: 'app-alert',
    templateUrl: 'alert.component.html',
    styleUrls: ['./alert.component.css']
})

export class AlertComponent implements OnInit {
    message: any;
    public darkAlerts = DARK_ALERTS;

    constructor(private alertService: AlertService) { }
    ngOnInit() {
        this.alertService.getMessage().subscribe(message => { this.message = message; });
    }

    /**
     *  Close message
     */
    closeMessage() {
        this.alertService.closeMessage();
    }
}
