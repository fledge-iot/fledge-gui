import { Component, OnInit } from '@angular/core';
import { ControlAPIFlowService, ProgressBarService, AlertService } from '../../../../services';

@Component({
    selector: 'app-api-flow',
    templateUrl: './api-flow.component.html',
    styleUrls: ['./api-flow.component.css']
})

export class APIFlowComponent implements OnInit {
    apiFlows; // TODO: typecast APIFlow

    constructor(
        private alertService: AlertService,
        private controlAPIFlowService: ControlAPIFlowService,
        private ngProgress: ProgressBarService) {}

    ngOnInit() {}

    getAPIFlows() {
        this.controlAPIFlowService.getAllAPIFlow()
      .subscribe(
        (data: any) => {
          /** request completed */
          this.apiFlows = data;
        },
        error => {
          /** request completed but error */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
    }

}