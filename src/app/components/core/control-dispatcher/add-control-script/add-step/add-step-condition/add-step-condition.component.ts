import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, NgForm } from '@angular/forms';
import { RolesService, SharedService } from '../../../../../../services';

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
    public sharedService: SharedService,
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
    this.conditionControls().controls['condition']?.patchValue(condition);
    this.conditionControls().markAsTouched();
    this.conditionControls().markAsDirty();
  }

  addConditionControl() {
    this.showConditionControl = true;
    this.conditionControls().addControl('key', new UntypedFormControl(''));
    this.conditionControls().addControl('condition', new UntypedFormControl(this.conditions[0]));
    this.conditionControls().addControl('value', new UntypedFormControl(''));
  }

  stepsFormGroup() {
    return this.control.form.controls['steps'] as UntypedFormGroup;
  }

  stepControlGroup(): UntypedFormGroup {
    return this.stepsFormGroup().controls[`step-${this.index}`] as UntypedFormGroup;
  }

  conditionControls(): UntypedFormGroup {
    const stepControl = this.stepControlGroup().controls[this.from] as UntypedFormGroup;
    const conditionControl = stepControl.controls['condition'] as UntypedFormGroup;
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
    this.conditionControls().controls['value']?.patchValue(value);
    this.conditionControls().markAsTouched();
    this.conditionControls().markAsDirty();
  }

  setConditionKey(key) {
    this.condition.key = key.trim();
    this.conditionControls().controls['key']?.patchValue(key.trim());
    this.conditionControls().markAsTouched();
    this.conditionControls().markAsDirty();
  }
}
