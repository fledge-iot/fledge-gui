import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormControl, FormGroup, NgForm } from '@angular/forms';

@Component({
  selector: 'app-add-delay',
  templateUrl: './add-delay.component.html',
  styleUrls: ['./add-delay.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class AddDelayComponent implements OnInit {

  @Input() controlIndex; // position of the control in the dom
  @Input() step; // type of step
  stepsGroup: FormGroup;

  constructor(private control: NgForm) { }

  ngOnInit(): void { }

  ngAfterViewInit() {
    setTimeout(() => {
      this.stepsGroup = this.control.controls[`step-${this.controlIndex}`] as FormGroup;
      this.stepsGroup.addControl('delay', new FormGroup({
        duration: new FormControl(''),
        condition: new FormGroup({})
      }));
    }, 0);
  }

  scriptControlGroup(): FormGroup {
    return this.stepsGroup.controls['delay'] as FormGroup;
  }

  setDuration(value: any) {
    this.scriptControlGroup().controls['duration'].setValue(value);
  }

}
