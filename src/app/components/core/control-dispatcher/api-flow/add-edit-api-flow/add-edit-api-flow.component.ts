import { Component, OnInit, EventEmitter } from '@angular/core';
import { TitleCasePipe } from '@angular/common';

import { APIFlow, User } from '../../../../../../../src/app/models';

import { Validators, UntypedFormGroup, UntypedFormBuilder, AbstractControl, UntypedFormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ControlUtilsService } from '../../control-utils.service';
import { DocService } from '../../../../../services/doc.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
    AlertService,
    ControlAPIFlowService,
    ProgressBarService,
    SchedulesService,
    UserService,
    RolesService,
    SharedService,
    AssetsService,
    ControlPipelinesService
  } from '../../../../../services';
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
    destinationNames = [];

    editMode = false;
    
    apiFlowName: string;
    af: APIFlow;
    
    apiFlowForm: UntypedFormGroup;

    allUsers: User[];
    loggedInUsername: string;

    APIFlowType = ['write', 'operation'];

    destroy$: Subject<boolean> = new Subject<boolean>();

    public reenableButton = new EventEmitter<boolean>(false);
    constructor(
        private route: ActivatedRoute,
        private assetService: AssetsService,
        private controlAPIFlowService: ControlAPIFlowService,
        private controlService: ControlDispatcherService,
        private controlPipelinesService: ControlPipelinesService,
        private schedulesService: SchedulesService,
        private alertService: AlertService,
        private ngProgress: ProgressBarService,
        private fb: UntypedFormBuilder,
        public rolesService: RolesService,
        private dialogService: DialogService,
        public docService: DocService,
        public sharedService: SharedService,
        private userService: UserService,
        private controlUtilsService: ControlUtilsService,
        private titlecasePipe: TitleCasePipe,
        private router: Router) {
            this.apiFlowForm = this.fb.group({
                name: ['', Validators.required],
                description: ['', Validators.required],
                operation_name: [''],
                variables: this.fb.array([]),
                constants: this.fb.array([])
            });
            this.sharedService.isUserLoggedIn
            .pipe(takeUntil(this.destroy$))
            .subscribe(value => {
              this.loggedInUsername = value.userName;
            });
        }

    ngOnInit() {
        this.af = {
            name: '',
            type: 'write',
            description: '',
            operation_name: '',
            permitted: false,
            destination: 'broadcast',
            constants: {},
            variables: {},
            anonymous: false,
            allow: []
          };
        this.getDestTypes();
        if(this.rolesService.hasControlAccess()) {
          this.getUsers();
        }
        this.route.params.subscribe(params => {
            this.apiFlowName = params['name'];
            if (this.apiFlowName) {
              this.getAPIFlow();
            } else {
                this.selectedType = 'write';
            }
        });     
    }

    addParameter(param = null, controlType = null) {
        if (controlType == null) {
            const variableControl = <UntypedFormArray>this.apiFlowForm.controls['variables'];
            const constControl = <UntypedFormArray>this.apiFlowForm.controls['constants'];
            variableControl.push(this.initParameter(param, 'variables'));
            constControl.push(this.initParameter(param, 'constants'));
        } else {
            const control = <UntypedFormArray>this.apiFlowForm.controls[controlType];
            control.push(this.initParameter(param, controlType));
        }
    }

    removeParameter(index: number, param) {
      // remove parameter from the list
      const control = <UntypedFormArray>this.apiFlowForm.controls[param];
      control.removeAt(index);
      this.apiFlowForm.markAsDirty();    
    }

    initParameter(param = null, controlType) {
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

    fillParameters(param, controlType) {
      let c = <UntypedFormArray>this.apiFlowForm.controls[controlType];
      c.clear();
      let i = 0;
      for (const [key, value] of Object.entries(param)) {
          this.addParameter({ index: i, key: key, value: value }, controlType);
          i++;
      }
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

    getAPIFlow() {
        /** request started */
        this.ngProgress.start();
        this.controlAPIFlowService.getAPIFlow(this.apiFlowName)
          .subscribe((data: APIFlow) => {
            this.editMode = true;
            this.ngProgress.done();
            this.af = data;
            
            this.apiFlowForm.get('name').setValue(data.name);
            this.apiFlowForm.get('description').setValue(data.description);
            if (data.type === 'operation') {
              this.apiFlowForm.get('operation_name').setValue(data.operation_name);
            }
            
            this.getDestinationNames({'name': this.titlecasePipe.transform(this.af.destination)});
            if (this.af.destination.toLowerCase() !== 'broadcast') {
                this.selectedDestinationName = this.af[this.af.destination.toLowerCase()];
            }
            this.selectedType = data.type;
                     
            this.fillParameters(data.variables, 'variables');
            this.fillParameters(data.constants, 'constants');
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

    saveAPIFlow(data) {
      let payload = this.af;
      
      payload.name = data.name;
      payload.description = data.description;
      payload.type = this.selectedType;
      if (payload.type === 'operation') {
        payload.operation_name = data.operation_name;
      }
      
      const destination = this.af.destination.toLowerCase();
      payload.destination = destination;     
      if (destination !== 'broadcast') {
          payload[destination] = this.selectedDestinationName;
      }

      let variables = {};
      let constants = {};
      data.variables.forEach(v => { variables[v.vName] = v.vValue });
      data.constants.forEach(c => { constants[c.cName] = c.cValue });
      payload.variables = variables;
      payload.constants = constants;

      if (this.editMode) {
          this.updateAPIFlow();
          return;
      }
      this.addAPIFlow();
    }

    addAPIFlow() {
      this.controlAPIFlowService.createAPIFlow(this.af) 
      .subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          this.reenableButton.emit(false);
          this.alertService.success(data.message, true);
          this.navigateToList();
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

    updateAPIFlow() {
      this.controlAPIFlowService.updateAPIFlow(this.apiFlowName, this.af) 
      .subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          this.reenableButton.emit(false);
          this.alertService.success(data.message, true);
          this.navigateToList();
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

    deleteAPIFlow() {
        this.controlAPIFlowService.deleteAPIFlow(this.apiFlowName) 
        .subscribe(
          (data: any) => {
            /** request completed */
            this.ngProgress.done();
            this.reenableButton.emit(false);
            this.alertService.success(data.message, true);
            this.navigateToList();
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

    checkAndRequestAPIFlow() {
      if (this.getFormControls('variables').length > 0) {
        this.openModal('confirmation-execute-dialog')
      } else {
      this.requestAPIFlow({});
      }
    }
  
    requestAPIFlow(payload) {
      this.controlUtilsService.requestAPIFlow(this.af.name, payload);
      this.getAPIFlow();
    }

    changeType(value) {
        this.selectedType = value === 'Select Type' ? '' : value;
    }

    getDestTypes() {
        this.controlPipelinesService.getSourceDestinationTypeList('destination')
          .subscribe((data: any) => {
            this.ngProgress.done();
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
        this.router.navigate(['control-dispatcher/entry-points']);
    }

    onCheckboxClicked(event) {
        this.af.anonymous = event.target.checked;
    }

    getFormControls(type): AbstractControl[] {
      return (<UntypedFormArray>this.apiFlowForm.get(type)).controls;
    }

    selectDestinationName(value) {
        this.selectedDestinationName = value === 'Select Destination Name' ? null : value;
    }

    getDestinationNames(selectedType) {
      this.destinationNames = [];
      this.selectedDestinationName = null;
      this.af.destination = selectedType.name === 'Select Destination Type' ? '' : selectedType.name;
      switch (selectedType.name) {
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
                if (this.af.destination === 'Service') {
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
              this.destinationNames = SortedSouthboundSvc.concat(SortedNorthboundSvc);
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
              this.destinationNames = nameList.sort((a, b) => a.name.localeCompare(b.name));
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
            this.destinationNames = data.scripts.sort((a, b) => a.name.localeCompare(b.name));
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

    addValueControl(controlType) {
        const control = <UntypedFormArray>this.apiFlowForm.controls[controlType];
        this.addParameter({index: control.value.length, key: '', value: ''}, controlType);
    }

    getUsers() {
        this.ngProgress.start();
        this.userService.getAllUsers()
          .subscribe(
            (userData) => {
              /** request completed */
              this.ngProgress.done();
              this.allUsers = userData['users'].map(user => {
                return user.userName;
              });
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

    selectAllowedUsers(usernames) {
        this.af.allow = usernames;
    }

    openModal(id: string) {
        this.reenableButton.emit(false);
        this.dialogService.open(id);
    }
    
    closeModal(id: string) {
        this.reenableButton.emit(false);
        this.dialogService.close(id);
    }

    goToLink(urlSlug: string) {
      this.docService.goToSetPointControlDocLink(urlSlug);
    }
}