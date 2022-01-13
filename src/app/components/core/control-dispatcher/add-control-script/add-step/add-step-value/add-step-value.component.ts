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
  @Input() from;


  valueControlCount = 0; //default one value control visible
  valueControls = [];
  keys;
  parameters = {
    index: 0,
    key: '',
    value: ''
  }

  values = [];
  stepTypeGroup: FormGroup;
  valuesGroup: FormGroup;

  constructor(private control: NgForm) { }

  ngOnInit(): void {
    this.valueControls = range(1);
    console.log(this.valueControls);

  }

  ngAfterViewInit() {
    setTimeout(() => {
      console.log(this.from);
      const stepsControl = this.control.controls[`step-${this.index}`] as FormGroup;
      console.log('stepsControl', stepsControl.controls);
      this.stepTypeGroup = stepsControl.controls[this.from] as FormGroup;
      this.valuesGroup = this.stepTypeGroup.controls[this.from === 'write' ? 'values' : 'parameters'] as FormGroup;
      console.log('this.valuesGroup', this.stepTypeGroup);
      // this.valuesGroup = this.control.controls['values'] as FormGroup;
      this.valuesGroup.addControl(`key-${this.valueControlCount}`, new FormControl({ index: this.valueControlCount, key: '', value: '' }));
      this.valuesGroup.addControl(`val-${this.valueControlCount}`, new FormControl({ index: this.valueControlCount, key: '', value: '' }));
    }, 300);
  }

  addValueControl() {
    this.valueControlCount += 1;
    this.valueControls.push(this.valueControlCount);
    console.log('addValueControl', this.valueControls);
    this.valuesGroup.addControl(`key-${this.valueControlCount}`, new FormControl({ index: this.valueControlCount, key: '', value: '' }));
    this.valuesGroup.addControl(`val-${this.valueControlCount}`, new FormControl({ index: this.valueControlCount, key: '', value: '' }));
    console.log('value group', this.stepTypeGroup);
    console.log('from  group', this.from);

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
