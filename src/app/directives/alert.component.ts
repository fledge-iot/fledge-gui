import { Component, OnInit } from '@angular/core';
import { AlertService } from '../services/index';

@Component({
    moduleId: module.id.toString(),
    selector: 'alert',
    templateUrl: 'alert.component.html',
    styleUrls: ['./alert.component.css']
})

export class AlertComponent implements OnInit {
    message: any;
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
