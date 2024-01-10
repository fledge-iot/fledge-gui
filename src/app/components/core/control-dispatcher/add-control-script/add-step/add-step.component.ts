import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, NgForm, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { orderBy } from 'lodash';
import { CustomValidator } from '../../../../../directives/custom-validator';
import { AlertService, ProgressBarService, RolesService } from '../../../../../services';
import { ControlDispatcherService } from '../../../../../services/control-dispatcher.service';

@Component({
  selector: 'app-add-step',
  templateUrl: './add-step.component.html',
  styleUrls: ['./add-step.component.css'],
})
export class AddStepComponent implements OnInit {
  scriptSteps = ['configure', 'delay', 'operation', 'script', 'write'];

  config: any;
  controlIndex;

  @Input() update;
  @Output() stepEvent = new EventEmitter<any>();

  stepControlsList = [];

  constructor(
    private route: ActivatedRoute,
    private control: NgForm,
    private alertService: AlertService,
    private controlService: ControlDispatcherService,
    private ngProgress: ProgressBarService,
    public rolesService: RolesService) {
    this.route.params.subscribe(params => {
      if (params['name']) {
        this.update = true;
        this.getControlScript(params['name']);
      }
    });
  }

  ngOnInit(): void { }

  ngAfterViewInit() {
    setTimeout(() => {
      if (!this.update) {
        this.initStepFormGroup(1);
      }
    }, 0);
  }

  initStepFormGroup(index) {
    this.stepsFormGroup().addControl(`step-${index}`, new UntypedFormGroup({}));
    this.stepControlsList.push({ key: '', order: index, add: true });
    this.stepEvent.emit(this.stepControlsList);
  }

  stepsFormGroup() {
    return this.control.form.controls['steps'] as UntypedFormGroup;
  }

  addStepControl() {
    if (this.stepControlsList.length > 0) {
      const maxOrder = Math.max(...this.stepControlsList.map(o => o.order));
      this.initStepFormGroup(maxOrder + 1)
    } else {
      this.initStepFormGroup(1)
    }
  }

  addNewStep(stepName, index) {
    this.stepControlsList.forEach(s => {
      if (s.order === index) {
        s.key = stepName;
      }
    });
    const step = { key: stepName, values: '' }
    this.selectStep(step, index);
    this.stepEvent.emit(this.stepControlsList);
  }

  deleteStepControl(index) {
    this.stepsFormGroup().removeControl(`step-${index}`);
    this.stepControlsList = this.stepControlsList.filter(s => s.order !== index)
    this.stepEvent.emit(this.stepControlsList);
    this.control.form.markAsTouched();
    this.control.form.markAsDirty();
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

  onDrop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    moveItemInArray(this.stepControlsList, event.previousIndex, event.currentIndex);
    this.stepEvent.emit(this.stepControlsList);
    this.control.form.markAsDirty();
  }

  trackByFn(index: any) {
    return index;
  }

  getControlScript(script: string) {
    this.stepControlsList = [];
    /** request started */
    this.ngProgress.start();
    this.controlService.fetchControlServiceScriptByName(script)
      .subscribe((data: any) => {
        this.ngProgress.done();
        // remove empty object {} from steps array
        data.steps = data.steps.filter(value => Object.keys(value).length !== 0);
        data.steps.forEach((step) => {
          const key = Object.keys(step)[0];
          const st = Object.values(step)[0];
          this.stepControlsList.push({ key, order: st['order'], add: false });
          const stepObj = { key, values: st };
          this.selectStep(stepObj, st['order']);
        });
        this.stepControlsList = orderBy(this.stepControlsList, 'order');
        this.stepEvent.emit(this.stepControlsList);
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

  stepControlGroup(index): UntypedFormGroup {
    return this.stepsFormGroup()?.controls[`step-${index}`] as UntypedFormGroup;
  }

  stepValuesGroup(step) {
    const config = step.values;
    const configuration = step.key === 'write' ? config.values : config.parameters;
    let x = new UntypedFormGroup({});
    if (configuration) {
      Object.keys(configuration).forEach((key, i) => {
        if (Object.prototype.hasOwnProperty.call(configuration, key)) {
          const element = configuration[key];
          x.addControl(`${step.key}-key-${i}`, new UntypedFormControl({ index: i, key: key }));
          x.addControl(`${step.key}-val-${i}`, new UntypedFormControl({ index: i, value: element }));
        }
      });
    }
    return x;
  }


  selectStep(step, index) {
    this.stepsFormGroup()?.removeControl(`step-${index}`);
    this.stepsFormGroup()?.addControl(`step-${index}`, new UntypedFormGroup({}));
    switch (step.key) {
      case 'write':
        this.stepControlGroup(index)?.setControl(step.key, new UntypedFormGroup({
          order: new UntypedFormControl(step?.values?.order),
          service: new UntypedFormControl(step?.values?.service, Validators.required),
          values: this.stepValuesGroup(step),
          condition: new UntypedFormGroup({
            key: new UntypedFormControl(step?.values?.condition?.key),
            condition: new UntypedFormControl(step?.values?.condition?.condition),
            value: new UntypedFormControl(step?.values?.condition?.value),
          })
        }));
        break;
      case 'operation':
        this.stepControlGroup(index)?.setControl(step.key, new UntypedFormGroup({
          order: new UntypedFormControl(step?.values?.order),
          name: new UntypedFormControl(step?.values?.name, [Validators.required, CustomValidator.nospaceValidator]),
          service: new UntypedFormControl(step?.values?.service),
          parameters: this.stepValuesGroup(step),
          condition: new UntypedFormGroup({
            key: new UntypedFormControl(step?.values?.condition?.key),
            condition: new UntypedFormControl(step?.values?.condition?.condition),
            value: new UntypedFormControl(step?.values?.condition?.value),
          })
        }));
        break;
      case 'delay':
        this.stepControlGroup(index)?.setControl(step.key, new UntypedFormGroup({
          order: new UntypedFormControl(step?.values?.order),
          duration: new UntypedFormControl(step?.values?.duration),
          condition: new UntypedFormGroup({
            key: new UntypedFormControl(step?.values?.condition?.key),
            condition: new UntypedFormControl(step?.values?.condition?.condition),
            value: new UntypedFormControl(step?.values?.condition?.value),
          })
        }));
        break;
      case 'configure':
        this.stepControlGroup(index)?.setControl(step.key, new UntypedFormGroup({
          order: new UntypedFormControl(step?.values?.order ? step?.values?.order : index),
          category: new UntypedFormControl(step?.values?.category),
          item: new UntypedFormControl(step?.values?.item),
          value: new UntypedFormControl(step?.values?.value),
          condition: new UntypedFormGroup({
            key: new UntypedFormControl(step?.values?.condition?.key),
            condition: new UntypedFormControl(step?.values?.condition?.condition),
            value: new UntypedFormControl(step?.values?.condition?.value),
          })
        }));
        break;
      case 'script':
        this.stepControlGroup(index)?.setControl(step.key, new UntypedFormGroup({
          order: new UntypedFormControl(step?.values?.order),
          name: new UntypedFormControl(step?.values?.name, [Validators.required, CustomValidator.nospaceValidator]),
          execution: new UntypedFormControl(step?.values?.execution),
          parameters: this.stepValuesGroup(step),
          condition: new UntypedFormGroup({
            key: new UntypedFormControl(step?.values?.condition?.key),
            condition: new UntypedFormControl(step?.values?.condition?.condition),
            value: new UntypedFormControl(step?.values?.condition?.value),
          })
        }));
        break;
      default:
        break;
    }
  }
}
