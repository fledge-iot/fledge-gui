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
      value: [param?.value, Validators.required]
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
      const params = config.map(c => c.values);
      const parameters = [];
      params.forEach(element => {
        for (const [key, value] of Object.entries(element)) {
          parameters.push({ key, value });
          this.addParameter({ key, value });
        }
      });
      return parameters;
    }
    return value;
  }

  setScript(script: any) {
    this.script = script;
    this.controlForm.markAsDirty();
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
    console.log('configuration', configuration);
    console.log('changeValues', changeValues);

    const configValue = JSON.parse(configuration.write.value);
    configValue[0].values = changeValues ? changeValues.parameters : '';
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
