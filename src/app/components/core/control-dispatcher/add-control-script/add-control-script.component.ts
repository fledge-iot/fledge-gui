import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { NgForm, NgModelGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { cloneDeep, isEmpty, range } from 'lodash';
import { Observable, of } from 'rxjs';
import { AlertService, ProgressBarService, SharedService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';
import { DialogService } from '../confirmation-dialog/dialog.service';

@Component({
  selector: 'app-add-control-script',
  templateUrl: './add-control-script.component.html',
  styleUrls: ['./add-control-script.component.css'],
})
export class AddControlScriptComponent implements OnInit {
  stepControlsList = [];

  stepData = [];
  acls = [{ name: 'None' }];
  selectedACL = 'None';
  @ViewChild('scriptForm') scriptForm: NgForm;
  @ViewChildren('stepCtrl') stepCtrl: QueryList<NgModelGroup>;
  controlScript = {
    name: '',
    steps: [],
    acls: ''
  }
  update = false;
  scriptName = '';
  addStep = false;

  constructor(
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
        this.getControlScript(this.scriptName);
      } else {
        this.stepControlsList = range(1);
      }
    });
    this.getAllACL();
  }

  refresh() {
    this.getControlScript(this.scriptName);
  }


  getControlScript(scriptName: string) {
    /** request started */
    this.ngProgress.start();
    this.controlService.fetchControlServiceScriptByName(scriptName)
      .subscribe((data: any) => {
        this.ngProgress.done();
        const steps = [];
        for (const [key, value] of Object.entries(data.steps)) {
          steps.push({ key, value })
        }
        data.steps = steps;
        this.controlScript = data;
        this.stepControlsList = [];
        this.selectACL(data.acl);
        this.controlScript.steps.map(step => {
          this.stepControlsList.push(step.value.order);
        })
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
        this.router.navigate(['control-dispatcher']);
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
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }


  public toggleDropdown() {
    const dropDown = document.querySelector('#acl-dropdown');
    dropDown.classList.toggle('is-active');
  }

  onDrop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    moveItemInArray(this.stepControlsList, event.previousIndex, event.currentIndex);
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

  getConfig(control) {
    if (this.controlScript) {
      return this.controlScript.steps.find(step => {
        return (step.value.order === control)
      }
      );
    }
  }

  stepControls(): Observable<any> {
    return of(this.stepControlsList);
  }

  setStep(data) {
    this.stepData.push(data);
  }


  addStepControl() {
    this.addStep = true;
    this.stepControlsList.push(this.stepControlsList.length);
  }

  deleteStepControl(index: number) {
    this.stepControlsList = this.stepControlsList.filter(c => c !== index);
    this.stepCtrl.map(ctl => {
      if (ctl.name === `step-${index}`) {
        this.scriptForm.removeFormGroup(ctl);
      } else {
        return ctl;
      }
    });
  }

  selectACL(acl) {
    this.selectedACL = acl;
  }

  flattenPayload(payload: any) {
    payload.steps.map((val: any) => {
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
      console.log('values', values);
      if (values) {
        values =
          Object.values(values)
            .filter((f: any) => (f.hasOwnProperty('key')))
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

    this.stepControlsList.map((value, index) => {
      for (const key in payload['steps'][value]) {
        payload['steps'][value][key]['order'] = index;
      }
    })

    console.log(payload);


    // change steps from array to object
    payload['steps'] = Object.assign({}, ...payload['steps']);
    return payload;
  }

  onSubmit(form: NgForm) {
    console.log('form.value', form.value);
    const formData = cloneDeep(form.value);
    let payload = {};
    payload['steps'] = Object.keys(formData).map((key, i) => {
      formData[key];
      return formData[`step-${i}`];
    }).filter(v => v).map(v => v);

    let { name } = formData;
    payload['name'] = name;
    payload = this.flattenPayload(payload);
    payload['acl'] = this.selectedACL;
    console.log('payload', payload);
    if (this.update) {
      this.updateControlScript(payload)
    } else {
      this.ngProgress.start();
      this.controlService.addControlScript(payload)
        .subscribe(() => {
          this.ngProgress.done();
          this.alertService.success('script created successfully.');
          setTimeout(() => {
            this.router.navigate(['control-dispatcher']);
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
