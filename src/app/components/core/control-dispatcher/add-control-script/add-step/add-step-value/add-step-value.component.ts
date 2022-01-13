import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormControl, FormGroup, NgForm } from '@angular/forms';
import { range } from 'lodash';

@Component({
  selector: 'app-add-step-value',
  templateUrl: './add-step-value.component.html',
  styleUrls: ['./add-step-value.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class AddStepValueComponent implements OnInit {
  @Input() index;
  valueControlCount = 0; //default one value control visible
  valueControls = [];
  keys;
  parameters = {
    index: 0,
    key: '',
    value: ''
  }

  values = [];
  valuesGroup: FormGroup;

  constructor(private control: NgForm) { }

  ngOnInit(): void {
    this.valueControls = range(1)
    console.log(this.valueControls);

  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.valuesGroup = this.control.controls['values'] as FormGroup;
      this.valuesGroup.addControl(`key-${this.valueControlCount}`, new FormControl({ index: this.valueControlCount, key: '', value: '' }))
      this.valuesGroup.addControl(`val-${this.valueControlCount}`, new FormControl({ index: this.valueControlCount, key: '', value: '' }))
    }, 0);
  }

  addValueControl() {
    this.valueControlCount += 1;
    this.valueControls.push(this.valueControlCount);
    console.log('addValueControl', this.valueControls);
    this.valuesGroup.addControl(`key-${this.valueControlCount}`, new FormControl({ index: this.valueControlCount, key: '', value: '' }))
    this.valuesGroup.addControl(`val-${this.valueControlCount}`, new FormControl({ index: this.valueControlCount, key: '', value: '' }))
    console.log('values ', this.control.controls['values']);
  }

  deleteControl(index) {
    // console.log('delete index', index);
    this.valueControlCount -= 1;
    // console.log('count', this.valueControlCount);
    this.valueControls = this.valueControls.filter(c => c !== index);
    // console.log('this.valueControls', this.valueControls);
    this.values = this.values.filter(v => v.index !== index);
    /// console.log('values', this.values);
  }

  setValue(index, value) {
    console.log('index', index);
    // console.log('value', value);
    // console.log('val con', this.valuesGroup.controls[`val-${index + 1}`]);
    this.valuesGroup.controls[`val-${index}`].setValue({ index, value })

  }

  setKey(index, key) {
    // console.log('index', index);
    // console.log('value', key);
    // console.log('key con', this.valuesGroup.controls[`key-${index + 1}`]);
    this.valuesGroup.controls[`key-${index}`].setValue({ index, key })

  }

}
