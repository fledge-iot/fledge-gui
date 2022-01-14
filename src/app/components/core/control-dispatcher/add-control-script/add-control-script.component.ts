import { Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { NgForm, NgModelGroup } from '@angular/forms';
import { range, cloneDeep } from 'lodash';
import { AlertService, ProgressBarService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';

@Component({
  selector: 'app-add-control-script',
  templateUrl: './add-control-script.component.html',
  styleUrls: ['./add-control-script.component.css'],
})
export class AddControlScriptComponent implements OnInit {
  submitted = false;

  scriptPayload = {
    name: '',
    acl: ''
  }

  stepControlCount = 0; //default one step control visible
  stepControlsList = []; //range(this.stepControlCount);

  stepData = [];
  acls = [{ name: 'None' }];
  selectedACL = 'None';
  @ViewChild('scriptForm') scriptForm: NgForm;
  @ViewChildren('stepCtrl') stepCtrl: QueryList<NgModelGroup>;

  constructor(private controlService: ControlDispatcherService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService) { }

  ngOnInit(): void {
    this.stepControlsList = range(1);
    this.getAllACL();
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

  setStep(data) {
    this.stepData.push(data);
  }


  addStepControl() {
    this.stepControlCount += 1;
    this.stepControlsList.push(this.stepControlCount);
  }

  deleteStepControl(index: number) {
    this.stepControlCount -= 1;
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
    this.selectedACL = acl.name;
  }

  flattenPayload(payload: any) {
    payload.steps.map(val => {
      let values;
      if ('write' in val) {
        values = val['write'].values;
      } else if ('operation' in val) {
        values = val['operation'].parameters;
      } else if ('script' in val) {
        values = val['script'].parameters;
      }
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
      return val;
    });

    // change steps from array to object
    payload['steps'] = Object.assign({}, ...payload['steps']);
    return payload;
  }

  onSubmit(form: NgForm) {
    const formData = cloneDeep(form.value);
    console.log('formData', formData);
    this.submitted = true;
    let payload = {};
    payload['steps'] = Object.keys(formData).map((key, i) => {
      formData[key];
      return formData[`step-${i}`];
    }).filter(v => v).map(v => v);

    let { name } = formData;
    payload['name'] = name;
    payload = this.flattenPayload(payload);
    payload['acl'] = this.selectedACL;
    this.controlService.addControlScript(payload)
      .subscribe((res: any) => {
        this.ngProgress.done();
        this.alertService.success('script created successfully.');
        this.alertService.error(res.message);
      }, error => {
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

}
