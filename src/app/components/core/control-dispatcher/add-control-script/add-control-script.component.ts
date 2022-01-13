import { Component, OnInit } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';
import { range } from 'lodash';
import { AlertService, ProgressBarService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';

@Component({
  selector: 'app-add-control-script',
  templateUrl: './add-control-script.component.html',
  styleUrls: ['./add-control-script.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class AddControlScriptComponent implements OnInit {
  submitted = false;

  scriptPayload = {
    name: '',
    acl: ''
  }

  stepControlCount = 1; //default one step control visible
  stepControls = []; //range(this.stepControlCount);

  stepData = [];
  acls = [];
  selectedACL;
  constructor(private controlService: ControlDispatcherService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService) { }

  ngOnInit(): void {
    this.stepControls = range(1);
    console.log(this.stepControls);
    this.getAllACL();
  }



  onClick() {

  }

  public toggleDropdown() {
    const dropDown = document.querySelector('#acl-dropdown');
    console.log('dropdown', dropDown.classList);
    dropDown.classList.toggle('is-active');
  }


  getAllACL() {
    this.controlService.fetchAllACL()
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.acls = data.acls;
        this.selectedACL = this.acls[0].name; // set first by default
        console.log(this.acls);
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
    console.log('control step data', data);
  }


  addStepControl() {
    this.stepControlCount += 1;
    this.stepControls.push(this.stepControlCount);
  }

  deleteStepControl() {
    this.stepControlCount -= 1;
    this.stepControls = range(this.stepControlCount);
  }

  selectACL(acl) {
    this.selectedACL = acl.name;

  }

  flattenPayload(payload: any) {
    console.log('pppp', payload);
    payload.steps = payload.steps.map(val => {
      let values;
      if ('write' in val) {
        values = val['write'].values;
        console.log('write val', values);
      } else if ('operation' in val) {
        values = val['operation'].parameters;
        console.log('operation val', values);
      }
      values =
        Object.values(values)
          .filter((f: any) => (f.hasOwnProperty('key')))
          .map((v: any) => {
            return { [v.key]: v.value };
          }).reduce((r, c) => ({ ...r, ...c }), {})

      if ('write' in val) {
        val['write'] = values;
      } else if ('operation' in val) {
        val['operation'] = values;
      }
      return val;
    });

    // change steps from array to object
    payload['steps'] = Object.assign({}, ...payload['steps']);
    return payload;
  }

  onSubmit(form: NgForm) {
    console.log('ngForm', form);
    this.submitted = true;
    console.log(Object.values(form.value));
    let payload = {};
    payload['steps'] = Object.keys(form.value).map((key, i) => {
      form.value[key];
      return form.value[`step-${i}`];
    }).filter(v => v).map(v => v);

    let { name } = form.value;
    payload['name'] = name;
    payload = this.flattenPayload(payload);

    payload['acl'] = this.selectedACL;
    console.log('payload', payload);

    // this.controlService.addControlScript(payload)
    //   .subscribe((res: any) => {
    //     this.ngProgress.done();
    //     console.log('res', res);
    //     this.alertService.error(res.message);
    //   }, error => {
    //     if (error.status === 0) {
    //       console.log('service down ', error);
    //     } else {
    //       this.alertService.error(error.statusText);
    //     }
    //   });
  }

}
