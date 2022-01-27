import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { SharedService } from '../../../../../../services';

@Component({
  selector: 'app-add-step-condition',
  templateUrl: './add-step-condition.component.html',
  styleUrls: ['./add-step-condition.component.css'],
})
export class AddStepConditionComponent implements OnInit {

  conditionGroup: FormGroup;
  stepTypeGroup: FormGroup;

  @Input() from;
  @Input() index;
  @Input() condition;
  @Input() update = false;

  conditions = ['==', '!=', '<', '>', '<=', '>='] // supported conditions
  selectedCondition = '==';
  conditionPayload = {
    key: '',
    condition: '==',
    value: ''
  }
  showConditionControl = false;

  constructor(private control: NgForm,
    public sharedService: SharedService) { }

  ngOnChanges() {
    this.showConditionControl = false;
    //this.condition = this.control.value['steps'][`step-${this.index}`]['delay'];
    this.condition = this.conditionControls().value;
    console.log(this.from, this.condition);

    // console.log('condition simpleChange', simpleChange);
    if (this.condition.key) {
      this.showConditionControl = true;
    }
    if (!this.condition?.condition) {
      this.setCondition(this.conditions[0]);
    }

    // if (!simpleChange['condition']?.firstChange && this.condition) {
    //   this.condition = simpleChange['condition'].currentValue;
    //   if (this.condition) {
    //     if (Object.keys(this.condition).length > 0) {
    //       this.addConditionControl();
    //       this.conditionPayload = this.condition;
    //       this.selectedCondition = this.conditionPayload.condition;
    //       Object.keys(this.condition).map((k) => {
    //         this.conditionControls().controls[k].patchValue(this.condition[k]);
    //       });
    //     }
    //   }
    // }
  }

  ngOnInit() { }

  ngAfterViewInit() {
    setTimeout(() => {
      // this.showConditionControl = false;
      // const stepsControl = this.control.controls[`step-${this.index}`] as FormGroup;
      // this.stepTypeGroup = stepsControl.controls[this.from] as FormGroup;
      // if (this.condition) {
      //   this.showConditionControl = true;
      //   if (Object.keys(this.condition).length > 0) {
      //     this.conditionPayload = this.condition;
      //     this.selectedCondition = this.conditionPayload.condition;
      //     Object.keys(this.condition).map((k) => {
      //       this.conditionControls().addControl(k, new FormControl(this.condition[k]));
      //     })
      //   }
      // }
    }, 300);
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

  setCondition(condition) {
    this.condition.condition = condition;
    // this.conditionPayload.condition = condition;
    this.conditionControls().controls['condition'].patchValue(condition)
  }

  addConditionControl() {
    this.showConditionControl = true;
    this.conditionControls().addControl('key', new FormControl(''));
    this.conditionControls().addControl('condition', new FormControl(this.selectedCondition));
    this.conditionControls().addControl('value', new FormControl(''));
  }

  // conditionControls(): FormGroup {
  //   return this.stepTypeGroup.controls['condition'] as FormGroup;
  // }

  stepsFormGroup() {
    return this.control.form.controls['steps'] as FormGroup;
  }

  stepControlGroup(): FormGroup {
    // console.log('steps group', this.stepsFormGroup());
    return this.stepsFormGroup().controls[`step-${this.index}`] as FormGroup;
  }

  conditionControls(): FormGroup {
    // console.log(this.stepControlGroup().controls[this.from] as FormGroup);
    const stepControl = this.stepControlGroup().controls[this.from] as FormGroup;
    const conditionControl = stepControl.controls['condition'] as FormGroup;
    // console.log('conditionControl', conditionControl);
    return conditionControl;
  }


  deleteControl() {
    this.showConditionControl = false;
    this.conditionPayload.key = '';
    this.conditionPayload.condition = '';
    this.conditionPayload.value = '';
    this.conditionControls().removeControl('key');
    this.conditionControls().removeControl('condition');
    this.conditionControls().removeControl('value');
  }

  setConditionValue(value) {
    this.condition.value = value;
    this.conditionControls().controls['value'].patchValue(value);
  }

  setConditionKey(key) {
    this.condition.key = key;
    this.conditionControls().controls['key'].patchValue(key);
  }
}
