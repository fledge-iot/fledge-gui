import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ControlContainer, FormGroup, NgForm, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-step',
  templateUrl: './add-step.component.html',
  styleUrls: ['./add-step.component.css'],
  // viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class AddStepComponent implements OnInit {
  scriptSteps = ['configure', 'delay', 'operation', 'script', 'write'];
  selectedStep;
  stepsGroup: FormGroup;

  @Input() controlIndex;
  @Input() payload;
  @Output() stepEvent = new EventEmitter<any>();
  constructor(private control: NgForm) { }

  ngOnInit(): void { }


  ngAfterViewInit() {
    setTimeout(() => {
      console.log('step page', this.controlIndex, this.control);
      // console.log('this.control.controls', this.controlIndex, this.control.controls);
      this.stepsGroup = this.control.controls[`step-${this.controlIndex}`] as FormGroup;
      this.stepsGroup.setValidators(Validators.requiredTrue);
      this.stepsGroup.updateValueAndValidity();
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

  selectStep(step: string) {
    this.selectedStep = step;
    this.stepsGroup.removeValidators(Validators.requiredTrue);
    this.stepsGroup.updateValueAndValidity();
  }

  getControl(control: FormGroup) {
    this.stepsGroup.addControl(this.selectedStep, control);
    // console.log('step', this.stepsGroup);
  }

}
