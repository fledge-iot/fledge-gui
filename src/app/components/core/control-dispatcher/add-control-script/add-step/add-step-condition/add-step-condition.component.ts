import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormControl, FormGroup, NgForm } from '@angular/forms';

@Component({
  selector: 'app-add-step-condition',
  templateUrl: './add-step-condition.component.html',
  styleUrls: ['./add-step-condition.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class AddStepConditionComponent implements OnInit {

  conditionGroup: FormGroup;
  stepTypeGroup: FormGroup;

  @Input() from;
  @Input() index;

  conditions = ['==', '!=', '<', '>', '<=', '>='] // supported conditions
  selectedCondition = '==';
  conditionPayload = {
    key: '',
    condition: '==',
    value: ''
  }
  showConditionControl = false;

  constructor(private control: NgForm) { }

  ngOnInit() {

  }

  // ngAfterViewInit() {
  //   // setTimeout(() => {
  //   //   this.conditionGroup = this.control.controls['condition'] as FormGroup;
  //   //   this.conditionGroup.addControl('key', new FormControl(''))
  //   //   this.conditionGroup.addControl('condition', new FormControl(this.selectedCondition))
  //   //   this.conditionGroup.addControl('value', new FormControl(''))
  //   //   // console.log('condition ', this.control.controls['condition']);
  //   //   // console.log('write group inside condtion', this.control.controls['write']);
  //   // }, 0);
  // }

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
    this.conditionGroup.controls['condition'].setValue(condition)
    this.conditionGroup.removeControl('condition');
  }

  addConditionControl() {
    this.showConditionControl = true;
    setTimeout(() => {
      const stepsControl = this.control.controls[`step-${this.index}`] as FormGroup;
      this.stepTypeGroup = stepsControl.controls[this.from] as FormGroup;
      this.stepTypeGroup.addControl('condition', new FormGroup({}))
      this.conditionGroup = this.stepTypeGroup.controls['condition'] as FormGroup;
      this.conditionGroup.addControl('key', new FormControl(''));
      this.conditionGroup.addControl('condition', new FormControl(this.selectedCondition));
      this.conditionGroup.addControl('value', new FormControl(''));
    }, 300);
  }

  deleteControl() {
    this.showConditionControl = false;
    this.conditionPayload.key = '';
    this.conditionPayload.condition = '';
    this.conditionPayload.value = '';
    this.conditionGroup.removeControl('key');
    this.conditionGroup.removeControl('condition');
    this.conditionGroup.removeControl('value');
    this.stepTypeGroup.removeControl('condition');
  }

  setConditionValue(value) {
    this.conditionPayload.value = value;
    this.conditionGroup.controls['value'].setValue(value);
  }

  setConditionKey(key) {
    this.conditionPayload.key = key;
    this.conditionGroup.controls['key'].setValue(key);
  }
}
