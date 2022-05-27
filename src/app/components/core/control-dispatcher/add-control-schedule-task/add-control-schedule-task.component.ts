import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService, ConfigurationService, ProgressBarService, SchedulesService, SharedService } from '../../../../services';
import { ControlDispatcherService } from '../../../../services/control-dispatcher.service';
import { isEmpty } from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from '../confirmation-dialog/dialog.service';

@Component({
  selector: 'app-add-control-schedule-task',
  templateUrl: './add-control-schedule-task.component.html',
  styleUrls: ['./add-control-schedule-task.component.css']
})
export class AddControlScheduleTaskComponent implements OnInit {
  scripts = [];
  script = '';
  scriptData: any;
  writeScriptParameters = [];
  controlForm: FormGroup;
  editMode = false;
  constructor(
    public sharedService: SharedService,
    public controlService: ControlDispatcherService,
    public alertService: AlertService,
    private dialogService: DialogService,
    private schedulesService: SchedulesService,
    private ngProgress: ProgressBarService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private configService: ConfigurationService,
    private router: Router) {
    this.controlForm = this.fb.group({
      parameters: this.fb.array([])
    });
    this.route.params.subscribe(params => {
      this.script = params['name'];
      if (this.script) {
        this.editMode = true;
        this.getScriptByName()
      }
    });
  }

  ngOnInit(): void {
    this.getScripts()
  }

  initParameter(param = null) {
    // initialize
    return this.fb.group({
      param: [param?.key, Validators.required],
      value: [param?.value]
    });
  }

  addParameter(param = null) {
    // add parameter to the list
    const control = <FormArray>this.controlForm.controls['parameters'];
    control.push(this.initParameter(param));
  }

  removeParameter(index: number) {
    // remove parameter from the list
    const control = <FormArray>this.controlForm.controls['parameters'];
    control.removeAt(index);
    this.controlForm.markAsDirty();
  }

  clearForm() {
    const control = <FormArray>this.controlForm.controls['parameters'];
    control.clear();
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

  refresh() {
    this.clearForm();
    this.getScriptByName();
  }

  getScriptByName() {
    this.ngProgress.start();
    this.controlService.fetchControlServiceScriptByName(this.script)
      .subscribe((data: any) => {
        this.scriptData = data;
        this.ngProgress.done();
        this.script = data.name;
        this.getScriptParameters(data.configuration?.write?.value)
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

  getScriptParameters(value) {
    if (value) {
      let config = JSON.parse(value);
      let params = config.map(c => c.values);
      let parameters = [];
      // generate parameters array
      params.forEach(element => {
        if (!element.hasOwnProperty("")) {
          for (const [key, value] of Object.entries(element)) {
            parameters.push({ key, value });
          }
        }
      });
      // remove duplicate objects from array
      parameters = [...new Set(parameters.map(o => JSON.stringify(o)))].map(s => JSON.parse(s));
      // generate parameters form controls
      parameters.forEach(e => {
        this.addParameter({ key: e.key, value: e.value });
      });
      return parameters;
    }
  }

  setScript(script: any) {
    this.scriptData = script;
    // Get write steps from script
    this.getControlParameters();
    this.script = script.name;
    this.controlForm.markAsDirty();
  }

  getControlParameters() {
    this.clearForm();
    this.writeScriptParameters = [];
    // Get steps of write script
    const scriptSteps = this.scriptData.steps.filter(({ write }) => write)
    // put all values of write step parameter into an array
    scriptSteps.forEach(({ write }) => {
      this.writeScriptParameters.push(...Object.values(write.values))
    });
    this.writeScriptParameters = [...new Set(this.writeScriptParameters)];
    // create form control for each parameter
    this.writeScriptParameters.forEach(key => {
      if (key.startsWith('$') && key.endsWith('$')) {
        // remove $ from start and end of the string
        key = key.substr(1).slice(0, -1);
        this.addParameter({ key, value: '' });
      }
    });
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
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

    if (this.editMode) {
      this.updateConfig(this.scriptData.configuration, payload);
      return;
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

  updateConfig(configuration, changeValues) {
    const configValue = JSON.parse(configuration.write.value);
    // put form control values in category config
    configValue.forEach(c => {
      for (const key in c.values) {
        if (changeValues.parameters.hasOwnProperty(key)) {
          c.values[key] = changeValues.parameters[key]
        }
      }
    });
    const payload = { write: JSON.stringify(configValue) };
    const categoryName = configuration.categoryName;
    /** request started */
    this.ngProgress.start();
    this.configService.updateBulkConfiguration(categoryName, payload).
      subscribe(
        () => {
          /** request completed */
          this.alertService.success('Configuration updated successfully.', true);
          this.ngProgress.done();
          this.controlForm.markAsPristine();
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

  /**
   * Delete control schedule
   *
   * To delete control script schedule first disable schedule,
   * and delete schedule then delete configuration category
   *
   * @param script Object
   */
  deleteControlSchedule(script) {
    const id = script.schedule.id;
    /** request started */
    this.ngProgress.start();
    // disable schedule
    this.schedulesService.disableSchedule(id)
      .subscribe(() => {
        // delete schedule
        this.schedulesService.deleteSchedule(id)
          .subscribe((data: any) => {
            this.ngProgress.done();
            this.alertService.success(data.message);
            const categoryName = script?.configuration?.categoryName;
            // close modal
            this.closeModal('confirmation-dialog');
            // delete category
            this.configService.deleteCategory(categoryName).subscribe((data: any) => {
              this.alertService.success(data.message);
              setTimeout(() => {
                this.router.navigate(['control-dispatcher'], { queryParams: { tab: 'tasks' } });
              }, 1000);
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


}
