import { ChangeDetectorRef, Component, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { cloneDeep, isEmpty, pickBy } from 'lodash';
import { AclService } from '../../../../services/acl.service';
import { AlertService, ProgressBarService, RolesService, SharedService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';
import { DocService } from '../../../../services/doc.service';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { AddStepComponent } from './add-step/add-step.component';
import { QUOTATION_VALIDATION_PATTERN } from '../../../../utils';


@Component({
  selector: 'app-add-control-script',
  templateUrl: './add-control-script.component.html',
  styleUrls: ['./add-control-script.component.css'],
})
export class AddControlScriptComponent implements OnInit {
  stepControlsList = [];

  acls = [{ name: 'None' }];
  selectedACL = '';

  @ViewChild('scriptForm') scriptForm: NgForm;
  @ViewChild('step') stepCtrl: AddStepComponent;

  editMode = false;
  scriptName = '';
  controlScript = { name: '', steps: [], acl: '' };
  QUOTATION_VALIDATION_PATTERN = QUOTATION_VALIDATION_PATTERN;

  public reenableButton = new EventEmitter<boolean>(false);
  constructor(
    private cdRef: ChangeDetectorRef,
    private route: ActivatedRoute,
    private controlService: ControlDispatcherService,
    private aclService: AclService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService,
    private dialogService: DialogService,
    public sharedService: SharedService,
    public docService: DocService,
    public rolesService: RolesService,
    private router: Router) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.scriptName = params['name'];
      if (this.scriptName) {
        this.editMode = true;
        this.getControlScript();
      }
    });
    this.getAllACL();
  }

  ngAfterContentChecked(): void {
    this.cdRef.detectChanges();
  }

  refresh() {
    this.stepCtrl.getControlScript(this.scriptName);
    this.getControlScript();
  }

  updateScriptName(name: string) {
    this.controlScript.name = name;
  }

  goToLink(urlSlug: string) {
    this.docService.goToSetPointControlDocLink(urlSlug);
  }

  getControlScript() {
    /** request started */
    this.ngProgress.start();
    this.controlService.fetchControlServiceScriptByName(this.scriptName)
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.controlScript.name = data.name;
        this.scriptName = data.name;
        this.controlScript.acl = data.acl;
        this.selectACL(data.acl);
        this.scriptForm.form.markAsUntouched();
        this.scriptForm.form.markAsPristine();
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

  deleteScript(script) {
    /** request started */
    this.ngProgress.start();
    this.controlService.deleteScript(script)
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertService.success(data.message, true);
        // close modal
        this.closeModal('confirmation-dialog');
        this.router.navigate(['control-dispatcher', 'script']);
      }, error => {
        /** request completed */
        this.ngProgress.done();
        this.reenableButton.emit(false);
        // close modal
        this.closeModal('confirmation-dialog');
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  public toggleDropdown() {
    const dropDown = document.querySelector('#acl-dropdown');
    dropDown.classList.toggle('is-active');
  }

  getAllACL() {
    this.aclService.fetchAllACL()
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.acls = this.acls.concat(data.acls);
      }, error => {
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  selectACL(acl) {
    this.selectedACL = acl === 'None' ? '' : acl;
    this.scriptForm.form.markAsDirty();
  }


  flattenPayload(steps: any[]) {
    steps.forEach((val: any) => {
      const keys = Object.keys(val);
      keys.forEach(key => {
        // remove invalid(null, undefined) values from object 
        val[key] = pickBy(val[key]);
        if ('condition' in val[key]) {
          if (isEmpty(val[key]['condition'].key) || val[key]['condition'].value == null) {
            delete val[key]['condition'];
          }
        }
      });

      let values;
      if ('configure' in val || 'delay' in val) {
        values = val;
      } else if ('write' in val) {
        values = val['write'].values;
      } else if ('operation' in val) {
        values = val['operation'].parameters;
      } else if ('script' in val) {
        values = val['script'].parameters;
      }

      if (values) {
        values = Object.values(values).reduce((acc: any, obj: any) => {
          let found = false;
          for (let i = 0; i < acc.length; i++) {
            if (acc[i].index === obj.index) {
              found = true;
              acc[i].value = obj.value;
            };
          }
          if (!found) {
            acc.push(obj);
          }
          return acc;
        }, []);

        values = Object.values(values)
          .map((v: any) => {
            return {
              ...(v.key?.trim() && { [v.key?.trim()]: v.value?.trim() })
            };
          }).reduce((r, c) => ({ ...r, ...c }), {});

        // update write step object
        if (val.hasOwnProperty('write')) {
          val['write'].values = values;
          if (this.isEmptyObject(values)) {
            delete val['write']?.values;
          }
        }

        // update operation step object
        if (val.hasOwnProperty('operation')) {
          val['operation'].parameters = values;
          if (this.isEmptyObject(values)) {
            delete val['operation']?.parameters;
          }
        }

        // update scripts step object
        if (val.hasOwnProperty('script')) {
          val['script'].parameters = values;
          if (this.isEmptyObject(values)) {
            delete val['script']?.parameters;
          }
        }
      }
      return val;
    });

    steps = steps.filter(s => Object.keys(s).length !== 0);
    steps.forEach(step => {
      const index = this.stepControlsList.findIndex(s => s.order === Object.values(step)[0]['order']);
      Object.values(step)[0]['order'] = index + 1;
    });
    return steps;
  }

  isEmptyObject(values = {}) {
    // check if object = {}
    return Object.keys(values).length == 0 ? true : false;
  }

  updatedStepList(list) {
    this.stepControlsList = list;
  }

  onSubmit(form: NgForm) {
    const formData = cloneDeep(form.value);
    let payload = {};
    let { name, steps } = formData;
    const step = []
    Object.keys(steps).forEach((key) => {
      step.push(steps[key])
      return formData[key];
    });

    payload['name'] = name;
    payload['steps'] = this.flattenPayload(step);

    // check if valid ACL
    if (this.selectedACL && !this.editMode) {
      payload['acl'] = this.selectedACL;
    }
    if (this.editMode) {
      if (this.controlScript.acl !== this.selectedACL) {
        // add acl='' in edit mode if acl is None
        payload['acl'] = this.selectedACL ? this.selectedACL : '';
      }
    }
    if (this.editMode) {
      this.updateControlScript(payload)
    } else {
      this.ngProgress.start();
      this.controlService.addControlScript(payload)
        .subscribe(() => {
          this.ngProgress.done();
          this.alertService.success(`Script ${payload['name']} created successfully.`);
          this.scriptForm.form.markAsUntouched();
          this.scriptForm.form.markAsPristine();
          setTimeout(() => {
            this.reenableButton.emit(false);
            this.router.navigate(['control-dispatcher', 'script']);
          }, 1000);
        }, error => {
          this.ngProgress.done();
          this.reenableButton.emit(false);
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
    }
  }

  updateControlScript(payload) {
    /** request started */
    this.ngProgress.start();
    this.controlService.updateScript(this.scriptName, payload)
      .subscribe((data: any) => {
        this.reenableButton.emit(false);
        this.scriptName = payload.name;
        this.router.navigate(['control-dispatcher', 'script']);
        this.alertService.success(data.message, true);
        /** request completed */
        this.ngProgress.done();
        this.refresh();
      }, error => {
        /** request completed */
        this.ngProgress.done();
        this.reenableButton.emit(false);
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

}
