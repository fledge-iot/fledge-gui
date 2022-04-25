import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService, SharedService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';
import { isEmpty } from 'lodash';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-control-schedule-task',
  templateUrl: './add-control-schedule-task.component.html',
  styleUrls: ['./add-control-schedule-task.component.css']
})
export class AddControlScheduleTaskComponent implements OnInit {
  scripts = [];
  script = '';
  controlForm: FormGroup;

  constructor(
    public sharedService: SharedService,
    public controlService: ControlDispatcherService,
    public alertService: AlertService,
    private fb: FormBuilder,
    private router: Router) {
    this.controlForm = this.fb.group({
      parameters: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.getScripts()
  }

  initParameter() {
    // initialize
    return this.fb.group({
      param: ['', Validators.required],
      value: ['', Validators.required]
    });
  }

  addParameter() {
    // add parameter to the list
    const control = <FormArray>this.controlForm.controls['parameters'];
    control.push(this.initParameter());
  }

  removeParameter(index: number) {
    // remove parameter from the list
    const control = <FormArray>this.controlForm.controls['parameters'];
    control.removeAt(index);
  }

  getParametersFormControls(): AbstractControl[] {
    return (<FormArray>this.controlForm.get('parameters')).controls
  }

  public toggleDropDown(id: string) {
    const dropdowns = document.getElementsByClassName('dropdown');
    for (let i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('is-active')) {
        openDropdown.classList.toggle('is-active', false);
      } else {
        if (openDropdown.id === id) {
          openDropdown.classList.toggle('is-active');
        }
      }
    }
  }

  public getScripts() {
    this.controlService.fetchControlServiceScripts()
      .subscribe((data: any) => {
        this.scripts = data.scripts;
      }, error => {
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  setScript(script: any) {
    this.script = script;
    console.log('script', script);
  }

  submit(data) {
    let parameters = {}
    data.parameters.forEach(item => { parameters[item.param] = item.value });
    let payload = {
      parameters
    }
    if (isEmpty(payload.parameters)) {
      payload = null;
    }
    this.controlService.addControlScheduleTask(this.script, payload).subscribe((data: any) => {
      this.alertService.success(data.message);
      setTimeout(() => {
        this.router.navigate(['control-dispatcher'], { queryParams: { tab: 'tasks' } });
      }, 1000);
    }, error => {
      if (error.status === 0) {
        console.log('service down ', error);
      } else {
        this.alertService.error(error.statusText);
      }
    });
  }

}
