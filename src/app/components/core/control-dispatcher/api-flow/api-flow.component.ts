import { Component, OnInit } from '@angular/core';
import { ControlAPIFlowService, ProgressBarService, RolesService, SharedService, AlertService } from '../../../../services';
import { DocService } from '../../../../services/doc.service';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { Validators, FormGroup, FormBuilder, AbstractControl, FormArray } from '@angular/forms';
import { UserService } from '../../../../services';

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { APIFlow, User } from '../../../../../../src/app/models';

@Component({
    selector: 'app-api-flow',
    templateUrl: './api-flow.component.html',
    styleUrls: ['./api-flow.component.css']
})

export class APIFlowComponent implements OnInit {
    apiFlows = [];
      
    // To show Entry point name and description on modal, we need these variables
    epName: string = '';
    description: string = '';

    
    loggedInUsername: string;
    allUsers: User[];
  
    // Check if it can be removed
    apiFlowForm: FormGroup;

    descriptionEditMode: boolean = false;

    destroy$: Subject<boolean> = new Subject<boolean>();

    constructor(
        private alertService: AlertService,
        private controlAPIFlowService: ControlAPIFlowService,
        private dialogService: DialogService,
        public docService: DocService,
        private userService: UserService,
        private ngProgress: ProgressBarService,
        private fb: FormBuilder,
        public sharedService: SharedService,
        public rolesService: RolesService) {
            this.apiFlowForm = this.fb.group({
                variables: this.fb.array([])
            });
            this.sharedService.isUserLoggedIn
            .pipe(takeUntil(this.destroy$))
            .subscribe(value => {
                this.loggedInUsername = value.loggedInUsername;
            });
      }

    ngOnInit() {
      this.getAPIFlows();
    }

    addParameter(param) {
        const control = <FormArray>this.apiFlowForm.controls['variables'];
        control.push(this.initParameter(param));
    }

    initParameter(param) {
        return this.fb.group({
            vName: [param?.key, Validators.required],
            vValue: [param?.value]
        });    
    }

    fillParameters(param) {
        let i = 0
        for (const [key, value] of Object.entries(param)) {
            this.addParameter({ index: i, key: key, value: value });
            i++;
        }
    }

    getFormControls(type): AbstractControl[] {
        return (<FormArray>this.apiFlowForm.get(type)).controls;
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

    getAPIFlow(name) {
        /** request started */
        this.ngProgress.start();
        this.controlAPIFlowService.getAPIFlow(name)
          .subscribe((data: APIFlow) => {
            this.ngProgress.done();
            let v = <FormArray>this.apiFlowForm.controls['variables'];
            v.clear();
            this.fillParameters(data.variables);
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

    deleteAPIFlow(id: string) {
      this.controlAPIFlowService.deleteAPIFlow(this.epName) 
      .subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();

          // Remove from local arrays of apiFlows
          this.apiFlows = this.apiFlows.filter(api => api.name !== this.epName);  

          this.alertService.success(data.message, true);
          this.closeModal(id);
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

    requestAPIFlow(payload) {
      let variables = {};
      payload.variables.forEach(v => { variables[v.vName] = v.vValue });
      this.controlAPIFlowService.requestAPIFlow(this.epName, variables) 
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

    updateDescripition(apiFlow) {
      let payload = {
        description: apiFlow.description
      };
      this.controlAPIFlowService.updateAPIFlow(apiFlow.name, payload) 
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

    openModal(id: string, name, description = null) {
      this.epName = name;
      this.description = description;
      this.dialogService.open(id);
    }

    closeModal(id: string) {
      this.dialogService.close(id);
    }

    goToLink(urlSlug: string) {
      this.docService.goToSetPointControlDocLink(urlSlug);
    }
}
