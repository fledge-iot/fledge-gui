import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormControl, FormGroup, NgForm } from '@angular/forms';
import { range, cloneDeep, uniqWith } from 'lodash';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-add-step-value',
  templateUrl: './add-step-value.component.html',
  styleUrls: ['./add-step-value.component.css'],
  // viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class AddStepValueComponent implements OnInit {
  @Input() index;
  @Input() from;


  valueControlCount = 0; //default one value control visible
  valueControlsList = [];
  keys;
  parameters = {
    index: 0,
    key: '',
    value: ''
  }

  // values = [];
  stepTypeGroup: FormGroup;
  valuesGroup: FormGroup;

  constructor(private control: NgForm) { }

  ngOnInit(): void {
    this.valueControlsList = range(1);
    // console.log(this.valueControls);

  }

  ngAfterViewInit() {
    setTimeout(() => {
      console.log('values page', this.index, this.control);
      // console.log(this.from);
      const stepsControl = this.control.controls[`step-${this.index}`] as FormGroup;
      console.log('stepsControl', stepsControl.controls);
      this.stepTypeGroup = stepsControl.controls[this.from] as FormGroup;
      console.log('stepTypeGroup', this.stepTypeGroup);

      this.valuesGroup = this.stepTypeGroup.controls[this.from === 'write' ? 'values' : 'parameters'] as FormGroup;
      console.log('this.valuesGroup', this.valuesGroup);
      // this.valuesGroup = this.control.controls['values'] as FormGroup;
      this.valuesGroup.addControl(`${this.from}-key-${this.valueControlCount}`, new FormControl({ index: this.valueControlCount, key: '', value: '' }));
      this.valuesGroup.addControl(`${this.from}-val-${this.valueControlCount}`, new FormControl({ index: this.valueControlCount, key: '', value: '' }));

      this.valuesGroup.valueChanges
        .pipe(debounceTime(300))
        .subscribe(
          (value: any) => {
            let vl = Object.keys(value).map(k => value[k]);
            cloneDeep(uniqWith(vl, (pre, cur) => {
              if (pre.index == cur.index) {
                cur.value = pre.value ? pre.value : cur.value;
                cur.key = cur.key ? cur.key : pre.key;
                return true;
              }
              return false;
            }));
          });
    }, 300);
  }

  addValueControl() {
    this.valueControlCount += 1;
    this.valueControlsList.push(this.valueControlCount);
    const stepsControl = this.control.controls[`step-${this.index}`] as FormGroup;
    console.log('stepsControl', stepsControl.controls);
    const stepTypeGroup = stepsControl.controls[this.from] as FormGroup;
    this.valuesGroup = stepTypeGroup.controls[this.from === 'write' ? 'values' : 'parameters'] as FormGroup;
    // console.log('addValueControl', this.valueControls);
    this.valuesGroup.addControl(`${this.from}-key-${this.valueControlCount}`, new FormControl({ index: this.valueControlCount, key: '', value: '' }));
    this.valuesGroup.addControl(`${this.from}-val-${this.valueControlCount}`, new FormControl({ index: this.valueControlCount, key: '', value: '' }));
    console.log('value group', stepTypeGroup);
    // console.log('from  group', this.from);

  }

  deleteControl(index) {
    this.valueControlCount -= 1;
    this.valueControlsList = this.valueControlsList.filter(c => c !== index);
    this.valuesGroup.removeControl(`${this.from}-key-${index}`);
    this.valuesGroup.removeControl(`${this.from}-val-${index}`);
  }

  setValue(index, value) {
    console.log('index', index);
    console.log('value', value);
    console.log('val con', this.valuesGroup.controls[`${this.from}-val-${index}`]);
    this.valuesGroup.controls[`${this.from}-val-${index}`].setValue({ index, value })

  }

  setKey(index, key) {
    // console.log('index', index);
    // console.log('value', key);
    // console.log('key con', this.valuesGroup.controls[`key-${index + 1}`]);
    this.valuesGroup.controls[`${this.from}-key-${index}`].setValue({ index, key })

  }

}
