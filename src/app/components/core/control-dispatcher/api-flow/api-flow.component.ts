import { Component, OnInit } from '@angular/core';
import { ControlAPIFlowService, ProgressBarService, RolesService, SharedService, AlertService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';
import { DocService } from '../../../../services/doc.service';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { QUOTATION_VALIDATION_PATTERN } from '../../../../utils';

@Component({
    selector: 'app-api-flow',
    templateUrl: './api-flow.component.html',
    styleUrls: ['./api-flow.component.css']
})

export class APIFlowComponent implements OnInit {
    apiFlows = []; // TODO: typecast APIFlow

    constructor(
        private alertService: AlertService,
        private controlService: ControlDispatcherService,
        private controlAPIFlowService: ControlAPIFlowService,
        private dialogService: DialogService,
        public docService: DocService,
        private ngProgress: ProgressBarService,
        public sharedService: SharedService,
        public rolesService: RolesService) {}

    ngOnInit() {
      this.getAPIFlows();
    }

    getAPIFlows() {
      this.ngProgress.start();
      this.controlAPIFlowService.getAllAPIFlow()
      .subscribe(
        (data: any) => {
          /** request completed */
          this.apiFlows = data.controls;
          this.ngProgress.done();
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

    deleteAPIFlow(name) {
      this.controlAPIFlowService.deleteAPIFlow(name) 
      .subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();

          // FIXME: delete from local this.apiFlows 
          this.getAPIFlows()

          this.alertService.success(data.message, true);
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

  // request/execute entrypoint
  requestAPIFlow(name, payload) {
    this.controlAPIFlowService.requestAPIFlow(name, payload) 
    .subscribe(
      (data: any) => {
        /** request completed */
        this.ngProgress.done();
        this.alertService.success(data.message, true);
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

// Set Anonymous T/F
onCheckboxClicked(event, name) {
  console.log(event.target.checked, name)
  // call update
} 

openModal(name, key, message) {
  console.log(name, key, message);
  // TODO show modal 
  if(key == 'delete'){
    this.deleteAPIFlow(name);
  }
  else if (key == 'executeRequest') {
    // TODO show modal and allow overriding var (&const??) values 
    let payload = {};
    this.requestAPIFlow(name, payload);
  }
  else {
    console.log("Invalid key : ", key);
  }
}

goToLink(urlSlug: string) {
  this.docService.goToSetPointControlDocLink(urlSlug);
}

}