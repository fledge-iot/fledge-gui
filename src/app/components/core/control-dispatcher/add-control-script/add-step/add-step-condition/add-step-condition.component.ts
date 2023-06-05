import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { RolesService } from '../../../../../../services';

@Component({
  selector: 'app-add-step-condition',
  templateUrl: './add-step-condition.component.html',
  styleUrls: ['./add-step-condition.component.css'],
})
export class AddStepConditionComponent implements OnInit {

  @Input() condition;

  @Input() from;
  @Input() index;
  @Input() update = false;

  conditions = ['==', '!=', '<', '>', '<=', '>='] // supported conditions
  showConditionControl = false;

  constructor(private control: NgForm,
    public rolesService: RolesService) { }

  ngOnChanges() {
    this.showConditionControl = false;
    this.condition = this.conditionControls().value;
    if (this.condition.key) {
      this.showConditionControl = true;
    }
    if (!this.condition?.condition) {
      this.setCondition(this.conditions[0]);
    }
  }

  ngOnInit() { }

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
    this.conditionControls().controls['condition'].patchValue(condition);
    this.conditionControls().markAsTouched();
    this.conditionControls().markAsDirty();
  }

  addConditionControl() {
    this.showConditionControl = true;
    this.conditionControls().addControl('key', new FormControl(''));
    this.conditionControls().addControl('condition', new FormControl(this.conditions[0]));
    this.conditionControls().addControl('value', new FormControl(''));
  }

  stepsFormGroup() {
    return this.control.form.controls['steps'] as FormGroup;
  }

  stepControlGroup(): FormGroup {
    return this.stepsFormGroup().controls[`step-${this.index}`] as FormGroup;
  }

  conditionControls(): FormGroup {
    const stepControl = this.stepControlGroup().controls[this.from] as FormGroup;
    const conditionControl = stepControl.controls['condition'] as FormGroup;
    return conditionControl;
  }

  deleteControl() {
    this.showConditionControl = false;
    this.conditionControls().removeControl('key');
    this.conditionControls().removeControl('condition');
    this.conditionControls().removeControl('value');
    this.conditionControls().markAsTouched();
    this.conditionControls().markAsDirty();
  }

  setConditionValue(value) {
    this.condition.value = value;
    this.conditionControls().controls['value'].patchValue(value);
    this.conditionControls().markAsTouched();
    this.conditionControls().markAsDirty();
  }

  setConditionKey(key) {
    this.condition.key = key.trim();
    this.conditionControls().controls['key'].patchValue(key.trim());
    this.conditionControls().markAsTouched();
    this.conditionControls().markAsDirty();
  }
}
