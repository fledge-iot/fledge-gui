import { Injectable } from '@angular/core';
import { ControlAPIFlowService, ProgressBarService, RolesService, SharedService, AlertService } from '../../../services';
import { DialogService } from '../../common/confirmation-dialog/dialog.service';

@Injectable({
    providedIn: 'root'
  })

export class ControlUtilsService {
    constructor(
        private controlAPIFlowService: ControlAPIFlowService,
        private ngProgress: ProgressBarService,
        private alertService: AlertService,
        private dialogService: DialogService){
    }

    // public static getDestinationNames(selectedType) {
    //     this.destinationNames = [];
    //     this.selectedDestinationName = null;
    //     this.af.destination = selectedType.name === 'Select Destination Type' ? '' : selectedType.name;
    //     switch (selectedType.name) {
    //       case 'Broadcast':
    //         this.selectedDestinationName = null;
    //         break;
    //       case 'Service':
    //         this.getServiceNames();
    //         break;
    //       case 'Asset':
    //         this.getAssetNames();
    //         break;
    //       case 'Script':
    //         this.getScriptNames();
    //         break;
    //       default:
    //         break;
    //     }
    // }

    requestAPIFlow(name, payload) {
        let variables = {};
        payload?.variables?.forEach(v => { variables[v.vName] = v.vValue });
  
        this.controlAPIFlowService.requestAPIFlow(name, variables)
        .subscribe((data: any) => {
            /** request completed */
            this.ngProgress.done();
            this.alertService.success(data.message, true);
            this.closeModal('confirmation-execute-dialog');
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
    
    closeModal(id: string) {
        this.dialogService.close(id);
    }

    // requestAPIFlow(payload) {
    //     let variables = {};
    //     payload?.variables?.forEach(v => { variables[v.vName] = v.vValue });       
    //     this.controlAPIFlowService.requestAPIFlow(this.af.name, variables) 
    //     .subscribe((data: any) => {
    //         /** request completed */
    //         this.ngProgress.done();
    //         this.alertService.success(data.message, true);
    //         this.closeModal('confirmation-execute-dialog');
    //         this.getAPIFlow();
    //         },
    //         error => {
    //         /** request completed but error */
    //         this.ngProgress.done();
    //         if (error.status === 0) {
    //             console.log('service down ', error);
    //         } else {
    //             this.alertService.error(error.statusText);
    //         }
    //     });
    // }
}
