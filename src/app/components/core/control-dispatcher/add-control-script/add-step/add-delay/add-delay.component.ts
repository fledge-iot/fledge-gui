import { Component, Input, OnInit, SimpleChange } from '@angular/core';
import { ControlContainer, FormControl, FormGroup, NgForm } from '@angular/forms';
import { SharedService } from '../../../../../../services';

@Component({
  selector: 'app-add-delay',
  templateUrl: './add-delay.component.html',
  styleUrls: ['./add-delay.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class AddDelayComponent implements OnInit {

  @Input() controlIndex; // position of the control in the dom
  @Input() step; // type of step
  @Input() config;
  @Input() update = false;

  stepsGroup: FormGroup;
  duration = '';

  constructor(private control: NgForm, public sharedService: SharedService) { }

  ngOnChanges(simpleChange: SimpleChange) {
    if (!simpleChange['config'].firstChange && this.config) {
      this.config = simpleChange['config'].currentValue;
      this.duration = this.config.value.duration;
      this.setDuration(this.duration);
    }
  }

  ngOnInit(): void { }

  ngAfterViewInit() {
    setTimeout(() => {
      this.stepsGroup = this.control.controls[`step-${this.controlIndex}`] as FormGroup;
      this.stepsGroup.addControl('delay', new FormGroup({
        duration: new FormControl(''),
        condition: new FormGroup({})
      }));

      if (this.config) {
        this.setDuration(this.config.value.duration);
      }
    }, 0);
  }

  scriptControlGroup(): FormGroup {
    return this.stepsGroup.controls['delay'] as FormGroup;
  }

  setDuration(value: any) {
    this.duration = value ? value : '';
    this.scriptControlGroup().controls['duration'].setValue(this.duration);
  }

}
