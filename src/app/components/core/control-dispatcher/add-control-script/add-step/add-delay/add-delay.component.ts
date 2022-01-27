import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, NgForm } from '@angular/forms';
import { SharedService } from '../../../../../../services';

@Component({
  selector: 'app-add-delay',
  templateUrl: './add-delay.component.html',
  styleUrls: ['./add-delay.component.css'],
})
export class AddDelayComponent implements OnInit {

  config;

  @Input() controlIndex; // position of the control in the dom
  @Input() step; // type of step
  @Input() update = false;

  constructor(public control: NgForm, public sharedService: SharedService) { }

  ngOnChanges() {
    this.config = this.control.value['steps'][`step-${this.controlIndex}`]['delay'];
    if (this.config) {
      this.setOrder();
    }
  }

  ngOnInit(): void { }

  stepsFormGroup() {
    return this.control.form.controls['steps'] as FormGroup;
  }

  stepControlGroup(): FormGroup {
    return this.stepsFormGroup().controls[`step-${this.controlIndex}`] as FormGroup;
  }

  delayFromGroup() {
    return this.stepControlGroup().controls['delay'] as FormGroup;
  }

  setDuration(value: any) {
    this.config.duration = value ? value : '';
    this.delayFromGroup().controls['duration'].patchValue(value);
  }

  setOrder() {
    this.delayFromGroup().controls['order'].patchValue(this.controlIndex);
  }

}
