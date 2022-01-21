import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, NgForm } from '@angular/forms';
import { SharedService } from '../../../../../services';

@Component({
  selector: 'app-add-step',
  templateUrl: './add-step.component.html',
  styleUrls: ['./add-step.component.css'],
})
export class AddStepComponent implements OnInit {
  scriptSteps = ['configure', 'delay', 'operation', 'script', 'write'];
  selectedStep;
  @Input() addStepClicked = false;
  @Input() config;
  @Input() controlIndex;
  @Input() update;
  @Input() payload;
  @Output() stepEvent = new EventEmitter<any>();

  // To hold update form status
  constrolStatus = { index: 0, update: 'false' };
  constructor(private control: NgForm, public sharedService: SharedService) { }

  ngOnInit(): void {
    this.constrolStatus = { index: this.controlIndex, update: 'false' };
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.config && !this.addStepClicked) {
        this.constrolStatus = { index: this.controlIndex, update: this.update };
        this.selectStep(this.config.key);
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

  setStepConfig(type: string) {
    if (this.config && this.config.key === type) {
      return this.config;
    }
    return;
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
    this.stepControlGroup().updateValueAndValidity();
  }

  getControl(control: FormGroup) {
    this.stepControlGroup().addControl(this.selectedStep, control);
  }

}
