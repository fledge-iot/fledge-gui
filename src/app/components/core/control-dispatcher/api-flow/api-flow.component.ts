import { Component, OnInit, OnDestroy, EventEmitter, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ControlAPIFlowService, ProgressBarService, RolesService, SharedService, AlertService } from '../../../../services';
import { DocService } from '../../../../services/doc.service';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { Validators, UntypedFormGroup, UntypedFormBuilder, AbstractControl, UntypedFormArray } from '@angular/forms';
import { ServiceWarningComponent } from '../../notifications/service-warning/service-warning.component';
import { AdditionalServicesUtils } from '../../developer/additional-services/additional-services-utils.service';

import { UserService } from '../../../../services';
import { ControlUtilsService } from '../control-utils.service';

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { APIFlow, User } from '../../../../../../src/app/models';

@Component({
  selector: 'app-api-flow',
  templateUrl: './api-flow.component.html',
  styleUrls: ['./api-flow.component.css']
})

export class APIFlowComponent implements OnInit, OnDestroy {
  @ViewChild(ServiceWarningComponent, { static: true }) notificationServiceWarningComponent: ServiceWarningComponent;

  apiFlows = [];

  // To show Entry point name and description on modal, we need these variables
  epName: string = '';
  description: string = '';

  loggedInUsername: string;
  allUsers: User[];

  // Check if it can be removed
  apiFlowForm: UntypedFormGroup;

  editMode: {};

  destroy$: Subject<boolean> = new Subject<boolean>();

  public reenableButton = new EventEmitter<boolean>(false);

  private serviceDetailsSubscription: Subscription;

  serviceInfo = { added: false, type: '', isEnabled: true, process: 'dispatcher', name: '', isInstalled: false };

  constructor(
    private alertService: AlertService,
    private controlAPIFlowService: ControlAPIFlowService,
    private dialogService: DialogService,
    public docService: DocService,
    private userService: UserService,
    private ngProgress: ProgressBarService,
    private fb: UntypedFormBuilder,
    public sharedService: SharedService,
    public activatedRoute: ActivatedRoute,
    private router: Router,
    private controlUtilsService: ControlUtilsService,
    private additionalServicesUtils: AdditionalServicesUtils,
    public rolesService: RolesService) {
    this.apiFlowForm = this.fb.group({
      variables: this.fb.array([])
    });
    this.sharedService.isUserLoggedIn
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.loggedInUsername = value.userName;
      });
    this.activatedRoute.paramMap
      .pipe(map(() => window.history.state)).subscribe((data: any) => {
        if (!data?.shouldSkipCalls) {
          this.additionalServicesUtils.getAllServiceStatus(false, 'dispatcher');
        }
      })
  }

  ngOnInit() {
    this.serviceDetailsSubscription = this.sharedService.installedServicePkgs.subscribe(service => {
      if (service) {
        const dispatcherServiceDetail = service.installed.find(s => s.process == 'dispatcher');
        if (dispatcherServiceDetail) {
          this.serviceInfo.isEnabled = ["shutdown", "disabled", "installed"].includes(dispatcherServiceDetail?.state) ? false : true;
          this.serviceInfo.isInstalled = true;
          this.serviceInfo.added = dispatcherServiceDetail?.added;
          this.serviceInfo.name = dispatcherServiceDetail?.name;
        } else {
          this.serviceInfo.isEnabled = false;
          this.serviceInfo.isInstalled = false;
          this.serviceInfo.added = false;
          this.serviceInfo.name = '';
        }
      }
    });
    this.getAPIFlows();
    this.resetEditMode();
  }

  refreshServiceInfo() {
    this.additionalServicesUtils.getAllServiceStatus(false, 'dispatcher');
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

        if (Object.entries(af.variables).length > 0) {
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

  setEdit(name, state) {
    this.editMode["name"] = name;
    this.editMode["edit"] = state;
    if (state == false) {
      this.updateDescription();
    }
  }

  resetEditMode() {
    this.editMode = { name: null, edit: false, value: null }
  }

  descriptionChange(event: any) {
    this.editMode["value"] = event
  }

  updateDescription() {
    if (this.editMode["value"] == null) {
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

  /**
   * Open Configure Service modal
   */
  openServiceConfigureModal() {
    this.router.navigate(['/developer/options/additional-services/config'], { state: { ...this.serviceInfo } });
  }

  closeModal(id: string) {
    this.reenableButton.emit(false);
    this.dialogService.close(id);
  }

  goToLink(urlSlug: string) {
    this.docService.goToSetPointControlDocLink(urlSlug);
  }

  ngOnDestroy() {
    this.serviceDetailsSubscription.unsubscribe();
  }
}
