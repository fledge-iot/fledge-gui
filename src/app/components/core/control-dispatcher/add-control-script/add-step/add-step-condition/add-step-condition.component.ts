import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';

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

  conditions = ['==', '!=', '<', '>', '<=', '>='] // supported conditions
  selectedCondition = '==';
  conditionPayload = {
    key: '',
    condition: '==',
    value: ''
  }
  showConditionControl = false;

  constructor(private control: NgForm) { }

  ngOnInit() { }

  ngAfterViewInit() {
    setTimeout(() => {
      this.showConditionControl = false;
      const stepsControl = this.control.controls[`step-${this.index}`] as FormGroup;
      this.stepTypeGroup = stepsControl.controls[this.from] as FormGroup;
      if (this.condition) {
        this.showConditionControl = true;
        if (Object.keys(this.condition).length > 0) {
          this.conditionPayload = this.condition;
          this.selectedCondition = this.conditionPayload.condition;
          Object.keys(this.condition).map((k) => {
            this.conditionControls().addControl(k, new FormControl(this.condition[k]));
          })
        }
      }
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
    this.selectedCondition = condition;
    this.conditionPayload.condition = condition;
    this.conditionControls().controls['condition'].setValue(condition)
  }

  addConditionControl() {
    this.showConditionControl = true;
    this.conditionControls().addControl('key', new FormControl(''));
    this.conditionControls().addControl('condition', new FormControl(this.selectedCondition));
    this.conditionControls().addControl('value', new FormControl(''));
  }

  conditionControls(): FormGroup {
    return this.stepTypeGroup.controls['condition'] as FormGroup;
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
    this.conditionPayload.value = value;
    this.conditionControls().controls['value'].setValue(value);
  }

  setConditionKey(key) {
    this.conditionPayload.key = key;
    this.conditionControls().controls['key'].setValue(key);
  }
}
