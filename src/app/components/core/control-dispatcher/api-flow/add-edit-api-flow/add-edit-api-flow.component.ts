import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { APIFlow } from '../../../../../../../src/app/models/api-flow';

import { NgForm, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
    AlertService,
    ControlAPIFlowService,
    ProgressBarService,
    SchedulesService,
    RolesService,
    SharedService,
    AssetsService,
    ToastService
  } from '../../../../../services';
  import { DocService } from '../../../../../services/doc.service';
  import { ControlDispatcherService } from '../../../../../services/control-dispatcher.service';
  import { DialogService } from '../../../../common/confirmation-dialog/dialog.service';
  import { QUOTATION_VALIDATION_PATTERN } from '../../../../../utils';

@Component({
    selector: 'app-add-edit-api-flow',
    templateUrl: './add-edit-api-flow.component.html',
    styleUrls: ['./add-edit-api-flow.component.css']
})

export class AddEditAPIFlowComponent implements OnInit {

    @ViewChild('pipelineForm') pipelineForm: NgForm;

    QUOTATION_VALIDATION_PATTERN = QUOTATION_VALIDATION_PATTERN;

    selectedType = ''; // required?

    selectedDestinationType = { cpdid: null, name: '' };
    selectedDestinationName = null; // required?
 
    destinationTypeList = []; // required?
    destinationNameList = []; // required?

    editMode = false;
    _name: string;
    af: APIFlow;

    constructor(
        private cdRef: ChangeDetectorRef,
        private route: ActivatedRoute,
        private assetService: AssetsService,
        private controlAPIFlowService: ControlAPIFlowService,
        private controlService: ControlDispatcherService,
        private schedulesService: SchedulesService,
        private alertService: AlertService,
        private ngProgress: ProgressBarService,
        public rolesService: RolesService,
        private dialogService: DialogService,
        public sharedService: SharedService,
        private docService: DocService,
        private router: Router,
        private toast: ToastService) {}

    ngOnInit() {
        this.getSourceDestTypes();
        this.route.params.subscribe(params => {
            this._name = params['name'];
            if (this._name) {
              this.editMode = true;
              this.getAPIFlow();
            }
        });
    }

    getAPIFlow() {
        /** request started */
        this.ngProgress.start();
        this.controlAPIFlowService.getAPIFlow(this._name)
          .subscribe((data: any) => {
            this.ngProgress.done();
            this.af = data;
          }, error => {
            /** request completed */
            this.ngProgress.done();
            if (error.status === 0) {
              console.log('service down ', error);
            } else {
              this.alertService.error(error.statusText);
            }
          });
    }

    addAPIFlow() {
        let payload = null;
        // Payload will be this.af?
        this.controlAPIFlowService.createAPIFlow(payload) 
        .subscribe(
          (data: any) => {
            /** request completed */
            this.ngProgress.done();  
            this.alertService.success(data.message, true);
            // reload?
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

    updateAPIFlow() {
        let payload = null;
        // Payload will be this.af?
        // renaming allowed?
        this.controlAPIFlowService.updateAPIFlow(this._name, payload) 
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

    deleteAPIFlow() {
        this.controlAPIFlowService.deleteAPIFlow(this._name) 
        .subscribe(
          (data: any) => {
            /** request completed */
            this.ngProgress.done();
            this.alertService.success(data.message, true);
            this.router.navigate(['control-dispatcher/api']);
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
      // payload having variables (& constants?) object with overridden values
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

    getSourceDestTypes() {
        this.controlAPIFlowService.getDestinationTypeList()
          .subscribe((data: any) => {
            this.ngProgress.done();
            // this.destinationTypeList = data;
            this.destinationTypeList = data.filter(d => d.name !== 'Any');
          }, error => {
            if (error.status === 0) {
              console.log('service down ', error);
            } else {
              this.alertService.error(error.statusText);
            }
          });
    }

    navigateToList() {
        this.router.navigate(['control-dispatcher/api']);
    }

    onCancel() {
        this.router.navigate(['control-dispatcher/api']);
    }

    onCheckboxClicked(event) {
        // Set Anonymous T/F
        // this.af.anonymous = event.target.checked;
        console.log(event.target.checked)
    } 
  
    selectDestinationName(value) {
        this.selectedDestinationName = value === 'Select Destination Name' ? null : value;
    }

    getDestinationNameList(selectedType) {
        this.destinationNameList = [];
        this.selectedDestinationName = null;
        this.selectedDestinationType = selectedType === 'Select Destination Type' ? '' : selectedType;
        switch (selectedType.name) {
          case 'Broadcast':
            this.selectedDestinationName = null;
            break;
          case 'Service':
            this.getServiceNameList();
            break;
          case 'Asset':
            this.getAssetNameList();
            break;
          case 'Script':
            this.getScriptNameList();
            break;
          default:
            break;
        }
    }

    getServiceNameList() {
        let names = [];
        /** request started */
        this.ngProgress.start();
        this.schedulesService.getSchedules().
          subscribe(
            (data: any) => {
              /** request completed */
              this.ngProgress.done();
              data.schedules.forEach(sch => {
                if (this.selectedDestinationType.name === 'Service') {
                  if (['STARTUP'].includes(sch.type) && ['south_c', 'north_C'].includes(sch.processName)) {
                    if (sch.processName === 'south_c') {
                      sch.groupbyType = 'Southbound';
                    }
                    if (sch.processName === 'north_C') {
                      sch.groupbyType = 'Northbound';
                    }
                    names.push(sch);
                  }
                } else {
                  if (!['STARTUP'].includes(sch.type)) {
                    names.push(sch);
                  }
                }
              });
              let southboundSvc = [];
              let northboundSvc = [];
              names.forEach(svc => {
                if (svc.processName === 'south_c') {
                  southboundSvc.push(svc);
                } else {
                  northboundSvc.push(svc);
                }
              })
              const SortedSouthboundSvc = southboundSvc.sort((a, b) => a.name.localeCompare(b.name));
              const SortedNorthboundSvc = northboundSvc.sort((a, b) => a.name.localeCompare(b.name));
              this.destinationNameList = SortedSouthboundSvc.concat(SortedNorthboundSvc);            
            },
            error => {
              /** request completed */
              this.ngProgress.done();
              if (error.status === 0) {
                console.log('service down ', error);
              } else {
                this.alertService.error(error.statusText);
              }
            });
    }

    getAssetNameList() {
        let nameList = [];
        /** request started */
        this.ngProgress.start();
        this.assetService.getAsset()
          .subscribe(
            (data: any[]) => {
              /** request completed */
              this.ngProgress.done();
              data.forEach(asset => {
                asset['name'] = asset.assetCode;
                nameList.push(asset);
              });
              this.destinationNameList = nameList.sort((a, b) => a.name.localeCompare(b.name));
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

    getScriptNameList() {
        /** request started */
        this.ngProgress.start();
        this.controlService.fetchControlServiceScripts()
          .subscribe((data: any) => {
            this.ngProgress.done();
            this.destinationNameList = data.scripts.sort((a, b) => a.name.localeCompare(b.name));
          }, error => {
            /** request completed */
            this.ngProgress.done();
            if (error.status === 0) {
              console.log('service down ', error);
            } else {
              this.alertService.error(error.statusText);
            }
          });
      }

    openModal(id: string) {
        console.log("openModal", id)
        // this.dialogService.open(id);
    }
    
    closeModal(id: string) {
        console.log("closeModal", id)
        // this.dialogService.close(id);
    }

}