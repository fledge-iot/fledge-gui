import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, NgForm, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-step',
  templateUrl: './add-step.component.html',
  styleUrls: ['./add-step.component.css'],
})
export class AddStepComponent implements OnInit {
  scriptSteps = ['configure', 'delay', 'operation', 'script', 'write'];
  selectedStep;
  // stepsGroup: FormGroup;

  @Input() controlIndex;
  @Input() payload;
  @Output() stepEvent = new EventEmitter<any>();
  constructor(private control: NgForm) { }

  ngOnInit(): void { }

  ngAfterViewInit() {
    setTimeout(() => {
      // this.stepsGroup = this.control.controls[`step-${this.controlIndex}`] as FormGroup;
      this.stepControlGroup().setValidators(Validators.requiredTrue);
      this.stepControlGroup().updateValueAndValidity();
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

  stepControlGroup(): FormGroup {
    return this.control.controls[`step-${this.controlIndex}`] as FormGroup;
  }

  selectStep(step: string) {
    // delete old step from  step form group
    const size = Object.keys(this.stepControlGroup().controls).length;
    if (size > 0) {
      const key = Object.keys(this.stepControlGroup().controls)[0];
      this.stepControlGroup().removeControl(key);
    }
    // add new step in step form group
    this.selectedStep = step;
    this.stepControlGroup().removeValidators(Validators.requiredTrue);
    this.stepControlGroup().updateValueAndValidity();
  }

  getControl(control: FormGroup) {
    this.stepControlGroup().addControl(this.selectedStep, control);
  }

}
