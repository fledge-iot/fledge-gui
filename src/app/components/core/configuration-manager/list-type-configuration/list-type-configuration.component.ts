import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective } from '@angular/forms';
import { filter } from 'lodash';
import { CustomValidator } from '../../../../directives/custom-validator';
import { cloneDeep } from 'lodash';
import { RolesService } from '../../../../services';

@Component({
  selector: 'app-list-type-configuration',
  templateUrl: './list-type-configuration.component.html',
  styleUrls: ['./list-type-configuration.component.css']
})
export class ListTypeConfigurationComponent implements OnInit {
  @Input() configuration;
  @Input() group: string = '';
  @Input() from = '';
  @Output() changedConfig = new EventEmitter<any>();
  @Output() formStatusEvent = new EventEmitter<any>();
  listItemsForm: FormGroup;
  initialProperties = [];

  constructor(
    public cdRef: ChangeDetectorRef,
    public rolesService: RolesService,
    private fb: FormBuilder) {
    this.listItemsForm = this.fb.group({
      listItems: this.fb.array([])
    })
  }

  ngOnInit() {
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

  initListItem(v: any = '') {
    let listItem;
    if (this.configuration.items == 'object') {
      let objectConfig = cloneDeep(this.configuration.properties);
      for (let [key, val] of Object.entries(v)) {
        objectConfig[key].value = val;
        if (objectConfig[key].type == 'json') {
          objectConfig[key].value = JSON.stringify(objectConfig[key].value);
        }
        // if cofiguration item has permissions array, pass that to the child config items
        if (this.configuration?.permissions) {
          objectConfig[key].permissions = this.configuration.permissions;
        }
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
    this.formStatusEvent.emit({ 'status': this.listItems.valid, 'group': this.group });
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
      if (this.configuration.items == 'object') {
        value = this.extractListValues(value);
      }
      this.changedConfig.emit({ [this.configuration.key]: JSON.stringify(value) });
      this.formStatusEvent.emit({ 'status': this.listItems.valid, 'group': this.group });
    })
  }

  getChangedConfiguration(index: string, propertyChangedValues: any) {
    for (let [ind, val] of this.listItems.value.entries()) {
      for (let property in val) {
        if (ind == index && property == Object.keys(propertyChangedValues)[0]) {
          val[property].value = Object.values(propertyChangedValues)[0];
        }
      }
      this.listItems.value[ind] = val;
    }
    let listValues = this.extractListValues(this.listItems.value);
    this.changedConfig.emit({ [this.configuration.key]: JSON.stringify(listValues) });
  }

  formStatus(formState: any) {
    this.formStatusEvent.emit(formState);
  }

  extractListValues(value) {
    let listValues = [];
    for (let val of value) {
      let valueObj = {};
      for (let property in val) {
        if(val[property].hasOwnProperty('value')){
          valueObj[property] = val[property].value;
        }
        else{
          valueObj[property] = val[property].default;
        }
        if (val[property].type == 'json') {
          valueObj[property] = JSON.parse(valueObj[property]);
        }
      }
      listValues.push(valueObj);
    }
    return listValues;
  }
}
