import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, NgForm } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { SharedService } from '../../../../../../services';

@Component({
  selector: 'app-add-step-value',
  templateUrl: './add-step-value.component.html',
  styleUrls: ['./add-step-value.component.css']
})
export class AddStepValueComponent implements OnInit {
  values;
  parameters = [];

  @Input() index;
  @Input() from;
  @Input() update = false;

  constructor(private control: NgForm,
    public sharedService: SharedService) { }

  ngOnChanges() {
    this.values = Object.values(this.valuesControlGroup().value);
    if (this.values.length == 0) {
      this.parameters.push({ index: 0, key: '', value: '' });
      this.valuesControlGroup().addControl(`${this.from}-key-${0}`, new FormControl({ index: 0, key: '' }));
      this.valuesControlGroup().addControl(`${this.from}-val-${0}`, new FormControl({ index: 0, value: '' }));
    }
    this.values.map((element) => {
      const index = this.parameters.findIndex(e => e.index === element.index)
      if (index !== -1) {
        this.parameters[index] = { ...element, ...this.parameters[index] };
      } else {
        this.parameters.push(element);
      }
    });
  }

  ngOnInit(): void { }

  ngAfterViewInit() {
    setTimeout(() => {
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
          });
    }, 100);
  }


  stepsFormGroup() {
    return this.control.form.controls['steps'] as FormGroup;
  }

  stepControlGroup(): FormGroup {
    return this.stepsFormGroup().controls[`step-${this.index}`] as FormGroup;
  }

  valuesControlGroup(): FormGroup {
    const stepControl = this.stepControlGroup().controls[this.from] as FormGroup;
    return stepControl.controls[this.from === 'write' ? 'values' : 'parameters'] as FormGroup;
  }

  addValueControl() {
    const index = this.parameters.length;
    this.parameters.push({ index: this.parameters.length, key: '', value: '' });
    this.valuesControlGroup().addControl(`${this.from}-key-${index}`, new FormControl({ index, key: '' }));
    this.valuesControlGroup().addControl(`${this.from}-val-${index}`, new FormControl({ index, value: '' }));
  }

  deleteControl(index) {
    this.parameters = this.parameters.filter(c => c.index !== index);
    this.valuesControlGroup().removeControl(`${this.from}-key-${index}`);
    this.valuesControlGroup().removeControl(`${this.from}-val-${index}`);
    this.valuesControlGroup().markAsDirty();
    this.valuesControlGroup().markAsTouched();
  }

  setValue(index, value) {
    this.valuesControlGroup().controls[`${this.from}-val-${index}`].setValue({ index, value });
    this.valuesControlGroup().markAsDirty();
    this.valuesControlGroup().markAsTouched();
  }

  setKey(index, key) {
    this.valuesControlGroup().controls[`${this.from}-key-${index}`].setValue({ index, key });
    this.valuesControlGroup().markAsDirty();
    this.valuesControlGroup().markAsTouched();
  }

}
