import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { cloneDeep, isEmpty } from 'lodash';
import { AlertService, ProgressBarService, SharedService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';
import { DialogService } from '../confirmation-dialog/dialog.service';
import { AddStepComponent } from './add-step/add-step.component';

@Component({
  selector: 'app-add-control-script',
  templateUrl: './add-control-script.component.html',
  styleUrls: ['./add-control-script.component.css'],
})
export class AddControlScriptComponent implements OnInit {
  stepControlsList = [];

  acls = [{ name: 'None' }];
  selectedACL = 'None';

  @ViewChild('scriptForm') scriptForm: NgForm;
  @ViewChild('step') stepCtrl: AddStepComponent;

  update = false;
  scriptName = '';
  controlScript = { name: '', steps: [], acls: 'None' };

  constructor(
    private cdRef: ChangeDetectorRef,
    private route: ActivatedRoute,
    private controlService: ControlDispatcherService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService,
    private dialogService: DialogService,
    public sharedService: SharedService,
    private router: Router) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.scriptName = params['name'];
      if (this.scriptName) {
        this.update = true;
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

  getControlScript() {
    /** request started */
    this.ngProgress.start();
    this.controlService.fetchControlServiceScriptByName(this.scriptName)
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.controlScript.name = data.name;
        this.scriptName = data.name;
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
        this.alertService.success(data.message);
        // close modal
        this.closeModal('confirmation-dialog');
        this.router.navigate(['control-dispatcher'], { queryParams: { tab: 'scripts' } });
      }, error => {
        /** request completed */
        this.ngProgress.done();
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
    this.controlService.fetchAllACL()
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
    this.selectedACL = acl;
    this.scriptForm.form.markAsDirty();
  }

  flattenPayload(steps: any) {
    Object.values(steps).map((val: any) => {
      let values;
      for (const key in val) {
        const element = val[key];
        if ('condition' in element) {
          if (isEmpty(element['condition'])) {
            delete element['condition'];
          }
        }
      }

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
            return { [v.key]: v.value };
          }).reduce((r, c) => ({ ...r, ...c }), {})

        if ('write' in val) {
          val['write'].values = values;
        } else if ('operation' in val) {
          val['operation'].parameters = values;
        } else if ('script' in val) {
          val['script'].parameters = values;
        }
      }
      return val;
    });

    steps = steps.filter(s => Object.keys(s).length !== 0);
    this.stepControlsList.map((value, index) => {
      steps.map(s => Object.keys(s).forEach(k => {
        if (k === value.key && s[k].order === value.order) {
          s[k].order = index;
        }
      }));
    })
    return steps;
  }

  updatedStepList(list) {
    this.stepControlsList = list;
  }

  onSubmit(form: NgForm) {
    console.log('form.value', form.value);
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
    payload['acl'] = this.selectedACL;
    console.log('payload', payload);
    if (this.update) {
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
            this.router.navigate(['control-dispatcher'], { queryParams: { tab: 'scripts' } });
          }, 1000);
        }, error => {
          this.ngProgress.done();
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
        this.alertService.success(data.message, true)
        /** request completed */
        this.ngProgress.done();
        this.refresh();
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

}
