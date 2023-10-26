import { Injectable, EventEmitter } from '@angular/core';
import { ControlAPIFlowService, ProgressBarService, AlertService } from '../../../services';
import { DialogService } from '../../common/confirmation-dialog/dialog.service';

@Injectable({
    providedIn: 'root'
  })

export class ControlUtilsService {
    public reenableButton = new EventEmitter<boolean>(false);

    constructor(
        private controlAPIFlowService: ControlAPIFlowService,
        private ngProgress: ProgressBarService,
        private alertService: AlertService,
        private dialogService: DialogService){
    }

    requestAPIFlow(name, payload) {
        let variables = {};
        payload?.variables?.forEach(v => { variables[v.vName] = v.vValue });
  
        this.controlAPIFlowService.requestAPIFlow(name, variables)
        .subscribe((data: any) => {
            /** request completed */
            this.ngProgress.done();
            this.reenableButton.emit(false);
            this.alertService.success(data.message, true);
            this.closeModal('confirmation-execute-dialog');
            },
            error => {
            /** request completed but error */
            this.ngProgress.done();
            this.reenableButton.emit(false);
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
}
