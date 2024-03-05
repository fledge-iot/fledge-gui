import { Component, OnInit, EventEmitter, ViewChild } from '@angular/core';
import { ControlAPIFlowService, ProgressBarService, RolesService, SharedService, AlertService } from '../../../../services';
import { DocService } from '../../../../services/doc.service';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { Validators, UntypedFormGroup, UntypedFormBuilder, AbstractControl, UntypedFormArray } from '@angular/forms';
import { UserService } from '../../../../services';
import { ControlUtilsService } from '../control-utils.service';

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { APIFlow, User } from '../../../../../../src/app/models';
import { AdditionalServiceModalComponent } from '../../developer/additional-services/additional-service-modal/additional-service-modal.component';

import { AddDispatcherServiceComponent } from './../add-dispatcher-service/add-dispatcher-service.component';

@Component({
    selector: 'app-api-flow',
    templateUrl: './api-flow.component.html',
    styleUrls: ['./api-flow.component.css']
})

export class APIFlowComponent implements OnInit {
  @ViewChild(AdditionalServiceModalComponent, { static: true }) additionalServiceModalComponent: AdditionalServiceModalComponent;
  @ViewChild(AddDispatcherServiceComponent, { static: true }) addDispatcherServiceComponent: AddDispatcherServiceComponent;

    apiFlows = [];

    // To show Entry point name and description on modal, we need these variables
    epName: string = '';
    description: string = '';

    isServiceAvailable = false;
    
    loggedInUsername: string;
    allUsers: User[];
  
    // Check if it can be removed
    apiFlowForm: UntypedFormGroup;

    editMode: {};

    destroy$: Subject<boolean> = new Subject<boolean>();

    public reenableButton = new EventEmitter<boolean>(false);

    showConfigureModal = false;
    serviceInfo: {};

    constructor(
        private alertService: AlertService,
        private controlAPIFlowService: ControlAPIFlowService,
        private dialogService: DialogService,
        public docService: DocService,
        private userService: UserService,
        private ngProgress: ProgressBarService,
        private fb: UntypedFormBuilder,
        public sharedService: SharedService,
        private controlUtilsService: ControlUtilsService,
        public rolesService: RolesService) {
            this.apiFlowForm = this.fb.group({
                variables: this.fb.array([])
            });
            this.sharedService.isUserLoggedIn
            .pipe(takeUntil(this.destroy$))
            .subscribe(value => {
                this.loggedInUsername = value.userName;
            });
      }

    ngOnInit() {
      this.getAPIFlows();
      this.resetEditMode();
    }

    addParameter(param) {
        const control = <UntypedFormArray>this.apiFlowForm.controls['variables'];
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
        return (<UntypedFormArray>this.apiFlowForm.get(type)).controls;
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

    getAndExecuteAPIFlow(name) {
        /** request started */
        this.ngProgress.start();
        this.controlAPIFlowService.getAPIFlow(name)
          .subscribe((af: APIFlow) => {
            this.ngProgress.done();
            let v = <UntypedFormArray>this.apiFlowForm.controls['variables'];
            v.clear();
            this.fillParameters(af.variables);
            // TODO: FOGL-8079 (blank values for variables are not allowed)
            // REMOVE:
            // af.variables = {}
            // ^ for forced testing only

            if(Object.entries(af.variables).length > 0) {
              this.openModal('confirmation-execute-dialog', af)
            } else {
              this.requestAPIFlow(af.name, {});
            }
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
          this.reenableButton.emit(false);

          // Remove from local arrays of apiFlows
          this.apiFlows = this.apiFlows.filter(api => api.name !== this.epName);  

          this.alertService.success(data.message, true);
          this.closeModal(id);
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

    requestAPIFlow(name, payload) {
      this.controlUtilsService.requestAPIFlow(name, payload);
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

    setEdit(name, state){
      this.editMode["name"] = name;
      this.editMode["edit"] = state;
      if (state == false){
        this.updateDescription();
      }
    }

    resetEditMode() {
      this.editMode = {name: null, edit: false, value: null}
    }

    descriptionChange(event: any) {
      this.editMode["value"] = event
    }

    updateDescription() {
      if(this.editMode["value"] == null) {
        this.resetEditMode();
        return;
      }
      const name = this.editMode["name"]
      let desc = this.editMode["value"]
      this.resetEditMode();
      let payload = {
        description: desc
      };
      this.controlAPIFlowService.updateAPIFlow(name, payload) 
      .subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();  
          this.alertService.success(data.message, true);
          // TODO: patch locally
          this.getAPIFlows();
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

    openModal(id: string, af) {
      this.epName = af.name;
      this.description = af.description;
      this.reenableButton.emit(false);
      this.dialogService.open(id);
    }

    onNotify(handleEvent) {
      if (handleEvent) {
        this.addDispatcherServiceComponent.getInstalledServicesList();
      }
      return;
    }

    getServiceDetail(event) {
      this.showConfigureModal = event.isOpen;
      delete event.isOpen;
      this.serviceInfo = event;
      if (this.showConfigureModal) {
        this.openServiceConfigureModal();
      }
    }

    /**
     * Open Configure Service modal
     */
    openServiceConfigureModal() {
      this.additionalServiceModalComponent.toggleModal(true);
      this.additionalServiceModalComponent.getServiceInfo(this.serviceInfo, null, 'dispatcher');
    }

    closeModal(id: string) {
      this.reenableButton.emit(false);
      this.dialogService.close(id);
    }

    goToLink(urlSlug: string) {
      this.docService.goToSetPointControlDocLink(urlSlug);
    }
}
