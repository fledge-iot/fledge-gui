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
      if(this.configuration.items == 'object') {
        this.initObjectListItem(element);
      }
      else{
        this.initListItem(element);
      }
    });
    this.onControlValueChanges();
  }

  get listItems() {
    return this.listItemsForm.get('listItems') as FormArray;
  }

  initListItem(v = '') {
    let listItem;
    listItem = new FormControl(v, [CustomValidator.nospaceValidator]);
    this.listItems.push(listItem);
    this.cdRef.detectChanges();
  }

  initObjectListItem(initialValue?: any) {
    let listItem;
    let objectConfig = cloneDeep(this.configuration.properties);
    if(initialValue) {
      for(let [key, val] of Object.entries(initialValue)) {
        objectConfig[key].value = val;
      }
    }
    this.initialProperties.push(objectConfig);
    listItem = new FormControl(JSON.stringify(objectConfig, null, ' '));
    this.listItems.push(listItem);
    this.cdRef.detectChanges();
  }

  addListItem() {
    const controlsLength = this.listItems.length;
    const listSize = this.configuration?.listSize > 0 ? +this.configuration.listSize : 999; // max threshold limit for new item creation
    if (controlsLength > listSize) {
      return;
    }
    if(this.configuration.items == 'object') {
      this.initObjectListItem();
    }
    else{
      this.initListItem();
    }
    // this.formState.emit(this.listItems.valid);
    this.formStatusEvent.emit({'status': this.listItems.valid, 'group': this.group});
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
      if(this.configuration.items == 'object') {
        let listValues = this.generateListValuesArray(value);
        this.changedConfig.emit({ [this.configuration.key]: JSON.stringify(listValues) });
      }
      else{
        this.changedConfig.emit({ [this.configuration.key]: JSON.stringify(value) });
      }
      this.formStatusEvent.emit({'status': this.listItems.valid, 'group': this.group});
      // this.form.get(this.configuration.key)?.patchValue(JSON.stringify(value))
      // this.formState.emit(this.listItems.valid);
    })
  }

  getChangedConfiguration(index: string, propertyChangedValues: any) {
    for (let [ind, val] of this.listItems.value.entries()) {
      let obj = JSON.parse(val);
      for (let property in obj) {
        if(ind==index && property == Object.keys(propertyChangedValues)[0]) {
          obj[property].value = Object.values(propertyChangedValues)[0];
        }
      }
      val = JSON.stringify(obj, null, ' ');
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
      let obj = JSON.parse(val);
      let valueObj = {};
      for (let property in obj) {
        valueObj[property] = obj[property].value ? obj[property].value : obj[property].default;
      }
      listValues.push(valueObj);
    }
    return listValues;
  }
}
