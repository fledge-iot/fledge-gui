import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective } from '@angular/forms';
import { filter } from 'lodash';
import { CustomValidator } from '../../../../directives/custom-validator';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'app-list-type-configuration',
  templateUrl: './list-type-configuration.component.html',
  styleUrls: ['./list-type-configuration.component.css']
})
export class ListTypeConfigurationComponent implements OnInit {
  @Input() configuration;
  // @Output() formState = new EventEmitter<boolean>();
  // form: FormGroup;
  listItemsForm: FormGroup;
  @Input() group: string = '';
  @Input() from = '';
  @Output() changedConfig = new EventEmitter<any>();
  @Output() formStatusEvent = new EventEmitter<any>();
  initialProperties = [];

  constructor(
    public cdRef: ChangeDetectorRef,
    // private rootFormGroup: FormGroupDirective,
    private fb: FormBuilder) {
    this.listItemsForm = this.fb.group({
      listItems: this.fb.array([])
    })
  }

  ngOnInit() {
    // this.form = this.rootFormGroup.control;
    let values = this.configuration?.value ? this.configuration.value : this.configuration.default;
    values = JSON.parse(values) as [];
    values.forEach(element => {
      this.initListItem(element);
    });
    this.onControlValueChanges();
  }

  get listItems() {
    return this.listItemsForm.get('listItems') as FormArray;
  }

  initListItem(v = '') {
    let listItem;
    if (this.configuration.items == 'object') {
      let objectConfig = cloneDeep(this.configuration.properties);
      for (let [key, val] of Object.entries(v)) {
        objectConfig[key].value = val;
      }
      this.initialProperties.push(objectConfig);
      listItem = new FormControl(objectConfig);
    }
    else {
      listItem = new FormControl(v, [CustomValidator.nospaceValidator]);
    }
    this.listItems.push(listItem);
    this.cdRef.detectChanges();
  }

  addListItem() {
    const controlsLength = this.listItems.length;
    const listSize = this.configuration?.listSize > 0 ? +this.configuration.listSize : 999; // max threshold limit for new item creation
    if (controlsLength > listSize) {
      return;
    }
    this.initListItem();
    // this.formState.emit(this.listItems.valid);
    this.formStatusEvent.emit({'status': this.listItems.valid, 'group': this.group});
  }

  removeListItem(index: number) {
    this.listItems.removeAt(index);
    this.initialProperties.splice(index, 1);
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
      if(this.configuration.items == 'object') {
        value = this.generateListValuesArray(value);
      }
      this.changedConfig.emit({ [this.configuration.key]: JSON.stringify(value) });
      this.formStatusEvent.emit({'status': this.listItems.valid, 'group': this.group});
      // this.form.get(this.configuration.key)?.patchValue(JSON.stringify(value))
      // this.formState.emit(this.listItems.valid);
    })
  }

  getChangedConfiguration(index: string, propertyChangedValues: any) {
    for (let [ind, val] of this.listItems.value.entries()) {
      for (let property in val) {
        if(ind==index && property == Object.keys(propertyChangedValues)[0]) {
          val[property].value = Object.values(propertyChangedValues)[0];
        }
      }
      this.listItems.value[ind] = val;
    }
    let listValues = this.generateListValuesArray(this.listItems.value);
    this.changedConfig.emit({ [this.configuration.key]: JSON.stringify(listValues) });
  }

  formStatus(formState: any) {
    this.formStatusEvent.emit(formState);
  }

  generateListValuesArray(value) {
    let listValues = [];
    for (let val of value) {
      let valueObj = {};
      for (let property in val) {
        valueObj[property] = val[property].value ? val[property].value : val[property].default;
      }
      listValues.push(valueObj);
    }
    return listValues;
  }
}
