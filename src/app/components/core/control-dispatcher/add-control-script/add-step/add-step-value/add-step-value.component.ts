import { Component, Input, OnInit, SimpleChange } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { cloneDeep, uniqWith } from 'lodash';

@Component({
  selector: 'app-add-step-value',
  templateUrl: './add-step-value.component.html',
  styleUrls: ['./add-step-value.component.css']
})
export class AddStepValueComponent implements OnInit {
  @Input() index;
  @Input() from;
  @Input() values;

  keys;
  parameters = [];

  constructor(private control: NgForm) { }

  ngOnChanges(simpleChange: SimpleChange) {
    if (!simpleChange['values'].firstChange) {
      this.values = simpleChange['values'].currentValue;
      this.parameters = [];
      if (this.values) {
        if (Object.keys(this.values).length > 0) {
          Object.keys(this.values).map((k, i) => {
            this.parameters.push({ index: i, key: k, value: this.values[k] });
          });
        }
      }
    }
  }

  ngOnInit(): void { }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.values) {
        if (Object.keys(this.values).length > 0) {
          Object.keys(this.values).map((k, i) => {
            this.parameters.push({ index: i, key: k, value: this.values[k] });
          })
        }
      } else {
        this.parameters.push({ index: 0, key: '', value: '' });
      }

      for (let i = 0; i < this.parameters.length; i++) {
        this.getValueControlGroup().addControl(`${this.from}-key-${i}`, new FormControl({ index: i, key: this.parameters[i].key, value: this.parameters[i].value }));
        this.getValueControlGroup().addControl(`${this.from}-val-${i}`, new FormControl({ index: i, key: this.parameters[i].key, value: this.parameters[i].value }));
      }
      this.getValueControlGroup().valueChanges
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
    const index = this.parameters.length;
    this.parameters.push({ index: this.parameters.length, key: '', value: '' });
    this.getValueControlGroup().addControl(`${this.from}-key-${index}`, new FormControl({ index, key: '', value: '' }));
    this.getValueControlGroup().addControl(`${this.from}-val-${index}`, new FormControl({ index, key: '', value: '' }));
  }

  getValueControlGroup(): FormGroup {
    const stepsControl = this.control.controls[`step-${this.index}`] as FormGroup;
    const stepTypeGroup = stepsControl.controls[this.from] as FormGroup;
    return stepTypeGroup.controls[this.from === 'write' ? 'values' : 'parameters'] as FormGroup;
  }

  deleteControl(index) {
    this.parameters = this.parameters.filter(c => c.index !== index);
    this.getValueControlGroup().removeControl(`${this.from}-key-${index}`);
    this.getValueControlGroup().removeControl(`${this.from}-val-${index}`);
  }

  setValue(index, value) {
    this.getValueControlGroup().controls[`${this.from}-val-${index}`].setValue({ index, value });
  }

  setKey(index, key) {
    this.getValueControlGroup().controls[`${this.from}-key-${index}`].setValue({ index, key });
  }

}
