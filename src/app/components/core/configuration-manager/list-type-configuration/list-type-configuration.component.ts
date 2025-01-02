import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective } from '@angular/forms';
import { filter, uniqWith, isEqual } from 'lodash';
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
  items = [];
  listLabel: string;
  firstKey: string;
  validConfigurationForm = true;

  constructor(
    public cdRef: ChangeDetectorRef,
    public rolesService: RolesService,
    private fb: FormBuilder) {
    this.listItemsForm = this.fb.group({
      listItems: this.fb.array([])
    })
  }

  ngOnInit() {
    if (this.configuration.items == 'object') {
      this.firstKey = Object.keys(this.configuration.properties)[0];
      // Show first property label as list card header
      this.listLabel = this.configuration.properties[this.firstKey].displayName ? this.configuration.properties[this.firstKey].displayName : this.firstKey;
    }
    let values = this.configuration?.value ? this.configuration.value : this.configuration.default;
    values = JSON.parse(values) as [];
    values.forEach(element => {
      this.initListItem(false, element);
    });
    this.onControlValueChanges();
    if (this.configuration.items == 'object' && this.listItems.length == 1) {
      this.expandListItem(this.listItems.length - 1); // Expand the list if only one item is present
    }
  }

  get listItems() {
    return this.listItemsForm.get('listItems') as FormArray;
  }

  initListItem(isPrepend, v: any = '') {
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
      if (isPrepend) {
        this.initialProperties.unshift(objectConfig);
        this.items.unshift({ status: true });
      }
      else {
        this.initialProperties.push(objectConfig);
        this.items.push({ status: true });
      }
      listItem = new FormControl(objectConfig);
    }
    else {
      listItem = new FormControl(v, [CustomValidator.nospaceValidator]);
    }
    if (isPrepend) {
      this.listItems.insert(0, listItem);
    }
    else {
      this.listItems.push(listItem);
    }
    this.cdRef.detectChanges();
  }

  addListItem(isPrepend) {
    const controlsLength = this.listItems.length;
    const listSize = this.configuration?.listSize > 0 ? +this.configuration.listSize : 999; // max threshold limit for new item creation
    if (controlsLength > listSize) {
      return;
    }
    this.initListItem(isPrepend);
    this.formStatusEvent.emit({ 'status': this.listItems.valid, 'group': this.group });
    if (this.configuration.items == 'object') {
      // Expand newly added item
      if (isPrepend) {
        this.expandListItem(0);
      }
      else {
        this.expandListItem(this.listItems.length - 1);
      }
    }
  }

  removeListItem(index: number) {
    this.listItems.removeAt(index);
    this.initialProperties.splice(index, 1);
    this.items.splice(index, 1);
    this.setChildConfigFormValidity();
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
      value = uniqWith(value, isEqual);
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
    listValues = uniqWith(listValues, isEqual);
    this.changedConfig.emit({ [this.configuration.key]: JSON.stringify(listValues) });
    this.formStatusEvent.emit({ 'status': this.listItems.valid, 'group': this.group });
  }

  formStatus(formState: any, index) {
    this.items[index].status = formState.status;
    this.setChildConfigFormValidity();
    this.formStatusEvent.emit(formState);
  }

  setChildConfigFormValidity() {
    if (this.items.find(value => value.status == false)) {
      this.validConfigurationForm = false;
      return;
    }
    this.validConfigurationForm = true;
  }

  extractListValues(value) {
    let listValues = [];
    for (let val of value) {
      let valueObj = this.extractSingleListValue(val);
      listValues.push(valueObj);
    }
    return listValues;
  }

  extractSingleListValue(val) {
    let valueObj = {};
    for (let property in val) {
      if (val[property].hasOwnProperty('value')) {
        valueObj[property] = val[property].value;
      }
      else {
        valueObj[property] = val[property].default;
      }
      if (val[property].type == 'json') {
        valueObj[property] = JSON.parse(valueObj[property]);
      }
    }
    return valueObj;
  }

  toggleCard(i) {
    let cardHeader = document.getElementById('card-header-' + this.configuration.key + '-' + i + '-' + this.from);
    let cardBody = document.getElementById('card-content-' + this.configuration.key + '-' + i + '-' + this.from);
    if (cardBody.classList.contains('is-hidden')) {
      cardBody.classList.remove('is-hidden');
      cardHeader.classList.add('is-hidden');
    }
    else {
      cardBody.classList.add('is-hidden');
      cardHeader.classList.remove('is-hidden');
    }
  }

  expandListItem(index) {
    setTimeout(() => {
      this.expandCollapseSingleItem(index, true);
    }, 1);
  }

  expandCollapseSingleItem(i: number, isExpand: boolean) {
    let cardHeader = document.getElementById('card-header-' + this.configuration.key + '-' + i + '-' + this.from);
    let cardBody = document.getElementById('card-content-' + this.configuration.key + '-' + i + '-' + this.from);
    if (isExpand) {
      cardHeader.classList.add('is-hidden');
      cardBody.classList.remove('is-hidden');
    }
    else {
      cardHeader.classList.remove('is-hidden');
      cardBody.classList.add('is-hidden');
    }
  }

  expandAllItems() {
    for (let i = 0; i < this.listItems.length; i++) {
      this.expandCollapseSingleItem(i, true);
    }
  }

  collapseAllItems() {
    for (let i = 0; i < this.listItems.length; i++) {
      this.expandCollapseSingleItem(i, false);
    }
  }
}
