import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ControlContainer, FormGroup, NgForm } from '@angular/forms';

@Component({
  selector: 'app-add-step',
  templateUrl: './add-step.component.html',
  styleUrls: ['./add-step.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
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
      this.stepsGroup = this.control.controls['steps'] as FormGroup;
    }, 0);
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
  }

  getControl(control: FormGroup) {
    this.stepsGroup.addControl(this.selectedStep, control);
    // console.log('step', this.stepsGroup);
  }

}
