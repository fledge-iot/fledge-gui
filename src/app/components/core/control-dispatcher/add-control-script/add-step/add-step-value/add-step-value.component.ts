import { Component, Input, OnInit, SimpleChange } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { map, groupBy, spread, assign } from 'lodash';
import { SharedService } from '../../../../../../services';

@Component({
  selector: 'app-add-step-value',
  templateUrl: './add-step-value.component.html',
  styleUrls: ['./add-step-value.component.css']
})
export class AddStepValueComponent implements OnInit {
  @Input() index;
  @Input() from;
  @Input() values;
  @Input() update = false;

  keys;
  parameters = [];

  constructor(private control: NgForm,
    public sharedService: SharedService) { }

  ngOnChanges() {
    // console.log('value page simpleChange', simpleChange);
    this.values = Object.values(this.valuesControlGroup().value);
    console.log('values screen', this.values);
    if (this.values.length == 0) {
      this.parameters.push({ index: 0, key: '', value: '' });
      // for (let i = 0; i < this.parameters.length; i++) {
      this.valuesControlGroup().addControl(`${this.from}-key-${0}`, new FormControl({ index: 0, key: '' }));
      this.valuesControlGroup().addControl(`${this.from}-val-${0}`, new FormControl({ index: 0, value: '' }));
      // }
    }
    this.values.map((element) => {
      const index = this.parameters.findIndex(e => e.index === element.index)
      if (index !== -1) {
        this.parameters[index] = { ...element, ...this.parameters[index] };
      } else {
        this.parameters.push(element);
      }
    });
    // console.log('this.parameters', this.parameters);


    // if (!simpleChange['values']?.firstChange && this.values) {
    //   this.values = simpleChange['values'].currentValue;
    // if (this.values) {
    //   this.parameters = [];
    //   if (this.values.length > 0) {
    //     this.values.forEach((k, i) => {

    //     });
    //   }
    // }
    // }
  }

  ngOnInit(): void { }

  ngAfterViewInit() {
    setTimeout(() => {
      // if (!this.values) {
      //   this.parameters.push({ index: 0, key: '', value: '' });
      // }
      // if (this.values) {
      //   if (Object.keys(this.values).length > 0) {
      //     Object.keys(this.values).map((k, i) => {
      //       this.parameters.push({ index: i, key: k, value: this.values[k] });
      //     })
      //   }
      // } else {
      //   this.parameters.push({ index: 0, key: '', value: '' });
      // }

      // for (let i = 0; i < this.parameters.length; i++) {
      //   this.getValueControlGroup().addControl(`${this.from}-key-${i}`, new FormControl({ index: i, key: this.parameters[i].key, value: this.parameters[i].value }));
      //   this.getValueControlGroup().addControl(`${this.from}-val-${i}`, new FormControl({ index: i, key: this.parameters[i].key, value: this.parameters[i].value }));
      // }
      this.valuesControlGroup().valueChanges
        .pipe(debounceTime(100))
        .subscribe(
          (value: any) => {
            let vl = Object.values(value).map(k => k);
            vl.reduce((acc: any, obj: any) => {
              let found = false;
              for (let i = 0; i < acc.length; i++) {
                if (acc[i].index === obj.index) {
                  found = true;
                  acc[i].value = obj.value;
                };
              }
              if (!found) {
                acc.push(obj);
              }
              return acc;
            }, []);
            // console.log('vl', vl);


            // // map(g, v => {
            // //   spread(assign(v))
            // // })
            // console.log(map(vl, (item) => {
            //   return extend(item, findWhere(a2 ))
            // }));

            // cloneDeep(uniqWith(vl, (pre, cur) => {
            //   if (pre.index == cur.index) {
            //     cur.value = pre.value ? pre.value : cur.value;
            //     cur.key = cur.key ? cur.key : pre.key;
            //     return true;
            //   }
            //   return false;
            // }));
          });
    }, 300);
  }


  stepsFormGroup() {
    return this.control.form.controls['steps'] as FormGroup;
  }

  stepControlGroup(): FormGroup {
    // console.log('steps group', this.stepsFormGroup());
    return this.stepsFormGroup().controls[`step-${this.index}`] as FormGroup;
  }

  valuesControlGroup(): FormGroup {
    const stepControl = this.stepControlGroup().controls[this.from] as FormGroup;
    return stepControl.controls[this.from === 'write' ? 'values' : 'parameters'] as FormGroup;
  }

  addValueControl() {
    // console.log('this.valuesControlGroup()', this.valuesControlGroup());

    const index = this.parameters.length;
    this.parameters.push({ index: this.parameters.length, key: '', value: '' });
    this.valuesControlGroup().addControl(`${this.from}-key-${index}`, new FormControl({ index, key: '' }));
    this.valuesControlGroup().addControl(`${this.from}-val-${index}`, new FormControl({ index, value: '' }));
  }

  // getValueControlGroup(): FormGroup {
  //   const stepsControl = this.control.controls[`step-${this.index}`] as FormGroup;
  //   const stepTypeGroup = stepsControl.controls[this.from] as FormGroup;
  //   return stepTypeGroup.controls[this.from === 'write' ? 'values' : 'parameters'] as FormGroup;
  // }

  deleteControl(index) {
    this.parameters = this.parameters.filter(c => c.index !== index);
    this.valuesControlGroup().removeControl(`${this.from}-key-${index}`);
    this.valuesControlGroup().removeControl(`${this.from}-val-${index}`);
  }

  setValue(index, value) {
    this.valuesControlGroup().controls[`${this.from}-val-${index}`].setValue({ index, value });
  }

  setKey(index, key) {
    this.valuesControlGroup().controls[`${this.from}-key-${index}`].setValue({ index, key });
  }

}
