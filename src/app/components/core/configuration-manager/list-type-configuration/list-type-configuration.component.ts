import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective } from '@angular/forms';
import { filter } from 'lodash';
import { CustomValidator } from '../../../../directives/custom-validator';

@Component({
  selector: 'app-list-type-configuration',
  templateUrl: './list-type-configuration.component.html',
  styleUrls: ['./list-type-configuration.component.css']
})
export class ListTypeConfigurationComponent implements OnInit {
  @Input() configuration;
  @Output() formState = new EventEmitter<boolean>();
  form: FormGroup;
  listItemsForm: FormGroup;

  constructor(
    public cdRef: ChangeDetectorRef,
    private rootFormGroup: FormGroupDirective,
    private fb: FormBuilder) {
    this.listItemsForm = this.fb.group({
      listItems: this.fb.array([])
    })
  }

  ngOnInit() {
    this.form = this.rootFormGroup.control;
    let val = this.configuration?.value ? this.configuration.value : this.configuration.default;
    val = JSON.parse(val) as [];
    for (let i = 0; i < val.length; i++) {
      const element = val[i];
      this.initListItem(element);
    }
    this.onControlValueChanges();
  }

  get listItems() {
    return this.listItemsForm.get('listItems') as FormArray;
  }

  initListItem(v = '') {
    const listItem = new FormControl(v, [CustomValidator.nospaceValidator]);
    this.listItems.push(listItem);
    this.cdRef.detectChanges();
  }

  addListItem() {
    const controlsLength = this.listItems.length;
    const listSize = +this.configuration?.listSize;
    if (controlsLength > listSize) {
      return;
    }
    this.initListItem();
    this.formState.emit(this.listItems.valid);
  }

  removeListItem(index: number) {
    this.listItems.removeAt(index);
  }

  onControlValueChanges(): void {
    this.listItems.valueChanges.subscribe((value) => {
      value = filter(value); // remove empty, undefined, null values
      // float value conversion
      if (this.configuration?.items == 'float') {
        value = value?.map((num: any) => {
          if (Number.isInteger(+num)) {
            return Number.parseFloat(num).toFixed(1); // update Integer value to single decimal point. e.g. 2 => 2.0
          }
          return num;
        });
      }
      this.form.get(this.configuration.key)?.patchValue(JSON.stringify(value))
      this.formState.emit(this.listItems.valid);
    })
  }
}
