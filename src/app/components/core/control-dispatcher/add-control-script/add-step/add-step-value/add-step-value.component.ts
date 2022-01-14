import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { range, cloneDeep, uniqWith } from 'lodash';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-add-step-value',
  templateUrl: './add-step-value.component.html',
  styleUrls: ['./add-step-value.component.css']
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
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const stepsControl = this.control.controls[`step-${this.index}`] as FormGroup;
      this.stepTypeGroup = stepsControl.controls[this.from] as FormGroup;
      this.valuesGroup = this.stepTypeGroup.controls[this.from === 'write' ? 'values' : 'parameters'] as FormGroup;
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
    const stepTypeGroup = stepsControl.controls[this.from] as FormGroup;
    this.valuesGroup = stepTypeGroup.controls[this.from === 'write' ? 'values' : 'parameters'] as FormGroup;
    this.valuesGroup.addControl(`${this.from}-key-${this.valueControlCount}`, new FormControl({ index: this.valueControlCount, key: '', value: '' }));
    this.valuesGroup.addControl(`${this.from}-val-${this.valueControlCount}`, new FormControl({ index: this.valueControlCount, key: '', value: '' }));
  }

  deleteControl(index) {
    this.valueControlCount -= 1;
    this.valueControlsList = this.valueControlsList.filter(c => c !== index);
    this.valuesGroup.removeControl(`${this.from}-key-${index}`);
    this.valuesGroup.removeControl(`${this.from}-val-${index}`);
  }

  setValue(index, value) {
    this.valuesGroup.controls[`${this.from}-val-${index}`].setValue({ index, value })

  }

  setKey(index, key) {
    this.valuesGroup.controls[`${this.from}-key-${index}`].setValue({ index, key })
  }

}
