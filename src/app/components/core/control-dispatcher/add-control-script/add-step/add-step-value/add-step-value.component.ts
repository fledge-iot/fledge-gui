import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';
import { range } from 'lodash';

@Component({
  selector: 'app-add-step-value',
  templateUrl: './add-step-value.component.html',
  styleUrls: ['./add-step-value.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class AddStepValueComponent implements OnInit {
  @Input() index;
  @Input() Name;
  valueControlCount = 1; //default one value control visible
  valueControls = [];
  keys;
  values;
  constructor() { }

  ngOnInit(): void {
    this.valueControls = range(this.valueControlCount)
  }

  addValueControl() {
    this.valueControlCount += 1;
    this.valueControls = range(this.valueControlCount);
  }

  deleteControl() {
    this.valueControlCount -= 1;
    this.valueControls = range(this.valueControlCount);
  }

}
