import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { APIFlow, APIFlowType, User } from '../../../../../../../src/app/models';

import { NgForm, Validators, FormGroup, FormBuilder, AbstractControl, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
    AlertService,
    ControlAPIFlowService,
    ProgressBarService,
    SchedulesService,
    UserService,
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

    QUOTATION_VALIDATION_PATTERN = QUOTATION_VALIDATION_PATTERN;

    selectedType;
    types = [];

    selectedDestinationType = { cpdid: 0, name: "Broadcast" };  // Typecast with DestinationType enum
    selectedDestinationName = null;
 
    destinationTypes = [];
    destinationNameList = [];

    editMode = false;
    _name: string;
    af: APIFlow;
    apiFlowForm: FormGroup;
    allUsers: User[];
    selectedUsers: [];

    constructor(
        private cdRef: ChangeDetectorRef,
        private route: ActivatedRoute,
        private assetService: AssetsService,
        private controlAPIFlowService: ControlAPIFlowService,
        private controlService: ControlDispatcherService,
        private schedulesService: SchedulesService,
        private alertService: AlertService,
        private ngProgress: ProgressBarService,
        private fb: FormBuilder,
        public rolesService: RolesService,
        private dialogService: DialogService,
        public sharedService: SharedService,
        private userService: UserService,
        private docService: DocService,
        private router: Router,
        private toast: ToastService) {
            this.apiFlowForm = this.fb.group({
                variables: this.fb.array([]),
                constants: this.fb.array([])
            });
        }

    ngOnInit() {
        this.af = {
            name: '',
            type: APIFlowType.Operation,  
            description: '',
            operation_name: '',
            destination: '',
            constants: {},
            variables: {},
            anonymous: false,
            allow: []
          };
        this.getSourceDestTypes();
        this.getUsers();
        
        this.route.params.subscribe(params => {
            this._name = params['name'];
            if (this._name) {
              this.editMode = true;
              this.getAPIFlow();
            } else {
                this.addParameter({ index: 0, key: '', value: '' });
            }
        });
        this.types = Object.keys(APIFlowType).map(key => APIFlowType[key]).filter(value => typeof value === 'string') as string[];
        this.selectedType = this.getSelectedType();
    }

    getSelectedType() {
        let keys = Object.keys(APIFlowType).filter(x => APIFlowType[x] == this.af.type);
        return keys.length > 0 ? keys[0] : null;
    }

    addParameter(param = null, controlType = null) {
        if (controlType == null) {
            const variableControl = <FormArray>this.apiFlowForm.controls['variables'];
            const constControl = <FormArray>this.apiFlowForm.controls['constants'];
            variableControl.push(this.initParameter(param, 'variables'));
            constControl.push(this.initParameter(param, 'constants'));
        } else {
            const control = <FormArray>this.apiFlowForm.controls[controlType];
            control.push(this.initParameter(param, controlType));
        }
    }

    initParameter(param = null, controlType) {
        // initialize
        if (controlType === 'variables') {
            return this.fb.group({
                vName: [param?.key, Validators.required],
                vValue: [param?.value]
              });
        } else {
            return this.fb.group({
                cName: [param?.key, Validators.required],
                cValue: [param?.value]
              });
        }     
    }

    getAPIFlow() {
        /** request started */
        this.ngProgress.start();
        this.controlAPIFlowService.getAPIFlow(this._name)
          .subscribe((data: APIFlow) => {
            this.ngProgress.done();
            this.af = data;
            this.selectedDestinationType.name = this.af.destination;
            if (this.selectedDestinationType.name !== 'Broadcast') {
                this.selectedDestinationName = this.af[this.selectedDestinationType.name];
            }
            this.getParameters(data.variables, 'variables');
            this.getParameters(data.constants, 'constants');
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

    getParameters(param, controlType) {
        let parameters = [];
        for (const [key, value] of Object.entries(param)) {
            parameters.push({ key, value });
        }
        // remove duplicate objects from array
        parameters = [...new Set(parameters.map(o => JSON.stringify(o)))].map(s => JSON.parse(s));
        // generate parameters form controls
        parameters.forEach((e, i) => {
            this.addParameter({ index: i, key: e.key, value: e.value }, controlType);
        });
        return parameters;
    }

    addAPIFlow() {
        let payload = null;
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

    public toggleDropdown(id) {
        const activeDropDowns = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
        if (activeDropDowns.length > 0) {
          if (activeDropDowns[0].id !== id) {
            activeDropDowns[0].classList.remove('is-active');
          }
        }
        const dropDown = document.querySelector(`#${id}`);
        dropDown.classList.toggle('is-active');
    }

    changeType(value) {
        this.selectedType = value === 'Select Type' ? '' : value;
    }

    getSourceDestTypes() {
        this.controlAPIFlowService.getDestinationTypes()
          .subscribe((data: any) => {
            this.ngProgress.done();
            // this.destinationTypes = data;
            this.destinationTypes = data.filter(d => d.name !== 'Any');
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
        this.af.anonymous = event.target.checked;
    }

    getFormControls(type): AbstractControl[] {
        return (<FormArray>this.apiFlowForm.get(type)).controls;
    }

    selectDestinationName(value) {
        this.selectedDestinationName = value === 'Select Destination Name' ? null : value;
    }

    getDestinationNames(selectedType) {
        this.destinationNameList = [];
        this.selectedDestinationName = null;
        this.selectedDestinationType = selectedType === 'Select Destination Type' ? '' : selectedType;
        switch (selectedType.name) {
          case 'Any':
          case 'Broadcast':
            this.selectedDestinationName = null;
            break;
          case 'Service':
            this.getServiceNames();
            break;
          case 'Asset':
            this.getAssetNames();
            break;
          case 'Script':
            this.getScriptNames();
            break;
          default:
            break;
        }
    }

    getServiceNames() {
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

    getAssetNames() {
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

    getScriptNames() {
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

    removeParameter(index: number, param) {
        // remove parameter from the list
        const control = <FormArray>this.apiFlowForm.controls[param];
        control.removeAt(index);
        this.apiFlowForm.markAsDirty();
    }

    addValueControl(controlType) {
        const control = <FormArray>this.apiFlowForm.controls[controlType];
        this.addParameter({index: control.value.length, key: '', value: ''}, controlType);
    }

    getUsers() {
        this.ngProgress.start();
        this.userService.getAllUsers()
          .subscribe(
            (userData) => {
              /** request completed */
              this.ngProgress.done();
              this.allUsers = userData['users'];
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

    selectAllowedUsers(user) {
        console.log('user', user);
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