import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { filter } from 'lodash';
import { CustomValidator } from '../../../../directives/custom-validator';
import { cloneDeep } from 'lodash';
import { RolesService } from '../../../../services';

@Component({
  selector: 'app-kv-list-type-configuration',
  templateUrl: './kv-list-type-configuration.component.html',
  styleUrls: ['./kv-list-type-configuration.component.css']
})
export class KvListTypeConfigurationComponent implements OnInit {
  @Input() configuration;
  @Input() group: string = '';
  @Input() from = '';
  @Output() changedConfig = new EventEmitter<any>();
  @Output() formStatusEvent = new EventEmitter<any>();
  kvListItemsForm: FormGroup;
  initialProperties = [];

  constructor(
    public cdRef: ChangeDetectorRef,
    public rolesService: RolesService,
    private fb: FormBuilder) {
    this.kvListItemsForm = this.fb.group({
      kvListItems: this.fb.array([])
    });
  }

  ngOnInit() {
    let values = this.configuration?.value ? this.configuration.value : this.configuration.default;
    values = JSON.parse(values) as [];
    for (const [key, value] of Object.entries(values)) {
      this.kvListItems.push(this.initListItem({ key, value }));
    }
    this.onControlValueChanges();
  }

  get kvListItems() {
    return this.kvListItemsForm.get('kvListItems') as FormArray;
  }

  initListItem(param) {
    if (this.configuration.items == 'enumeration') {
      return this.fb.group({
        key: [param?.key, [Validators.required, CustomValidator.nospaceValidator]],
        value: [param?.value ? param?.value : this.configuration.options?.[0]]
      });
    }
    if (this.configuration.items == 'object') {
      let objectConfig = cloneDeep(this.configuration.properties);
      for (let [key, val] of Object.entries(param?.value)) {
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
      return this.fb.group({
        key: [param?.key, [Validators.required, CustomValidator.nospaceValidator]],
        value: [objectConfig]
      });
    }
    return this.fb.group({
      key: [param?.key, [Validators.required, CustomValidator.nospaceValidator]],
      value: [param?.value, CustomValidator.nospaceValidator]
    });
  }

  addListItem() {
    const controlsLength = this.kvListItems.length;
    const listSize = this.configuration?.listSize > 0 ? +this.configuration.listSize : 999; // max threshold limit for new item creation
    if (controlsLength > listSize) {
      return;
    }
    this.kvListItems.push(this.initListItem({ key: '', value: '' }));
    this.formStatusEvent.emit({ 'status': this.kvListItems.valid, 'group': this.group });
    if(this.configuration.items == 'object'){
      this.expandAddedListItem();
    }
  }

  removeListItem(index: number) {
    this.kvListItems.removeAt(index);
    this.initialProperties.splice(index, 1);
  }

  onControlValueChanges(): void {
    this.kvListItems.valueChanges.subscribe((data) => {
      // remove empty, undefined, null values
      data = filter((data), (d: any) => d.key && d.key.trim() !== ''); // remove empty, undefined, null values
      const transformedObject = {};
      data.forEach(item => {
        // float value conversion
        if (this.configuration?.items == 'float') {
          if (+item.value && Number.isInteger(+item.value)) {
            item.value = Number.parseFloat(item.value).toFixed(1); // update Integer value to single decimal point. e.g. 2 => 2.0
          } else {
            if (item.value.trim() == '')
              item.value = Number.parseFloat('0').toFixed(1); // set default 0.0 if no value passed in the input field
          }
        }
        let itemValue = item.value;
        if (this.configuration.items == 'object') {
          itemValue = this.extractKvListValues(item.value);
        }
        transformedObject[item.key] = itemValue;
      });
      this.changedConfig.emit({ [this.configuration.key]: JSON.stringify(transformedObject) });
      this.formStatusEvent.emit({ 'status': this.kvListItems.valid, 'group': this.group });
    })
  }

  getChangedConfiguration(index: string, propertyChangedValues: any) {
    const transformedObject = {};
    for (let [ind, val] of this.kvListItems.value.entries()) {
      for (let property in val.value) {
        if (ind == index && property == Object.keys(propertyChangedValues)[0]) {
          val.value[property].value = Object.values(propertyChangedValues)[0];
        }
      }
      this.kvListItems.value[ind] = val;
      transformedObject[val.key] = this.extractKvListValues(val.value);
    }
    this.changedConfig.emit({ [this.configuration.key]: JSON.stringify(transformedObject) });
    this.formStatusEvent.emit({ 'status': this.kvListItems.valid, 'group': this.group });
  }

  formStatus(formState: any) {
    this.formStatusEvent.emit(formState);
  }

  extractKvListValues(value) {
    let valueObj = {};
    for (let property in value) {
      if(value[property].hasOwnProperty('value')){
        valueObj[property] = value[property].value;
      }
      else{
        valueObj[property] = value[property].default;
      }
      if (value[property].type == 'json') {
        valueObj[property] = JSON.parse(valueObj[property]);
      }
    }
    return valueObj;
  }

  toggleCard(index) {
    let cardBody = document.getElementById('card-content-' + this.configuration.key + '-' + index);
    let cardSpan = document.getElementById('card-span-' + this.configuration.key + '-' + index);
    let cardIcon = document.getElementById('card-icon-' + this.configuration.key + '-' + index);
    if (cardBody.classList.contains('is-hidden')) {
      cardBody.classList.remove('is-hidden');
      cardSpan.title = 'Collapse';
      cardIcon.classList.remove('fa-angle-right');
      cardIcon.classList.add('fa-angle-down');
    }
    else {
      cardBody.classList.add('is-hidden');
      cardSpan.title = 'Expand';
      cardIcon.classList.remove('fa-angle-down');
      cardIcon.classList.add('fa-angle-right');
    }
  }

  expandAddedListItem() {
    setTimeout(() => {
      let index = this.kvListItems.length - 1;
      let cardBody = document.getElementById('card-content-' + this.configuration.key + '-' + index);
      let cardSpan = document.getElementById('card-span-' + this.configuration.key + '-' + index);
      let cardIcon = document.getElementById('card-icon-' + this.configuration.key + '-' + index);
      cardSpan.title = 'Collapse';
      cardIcon.classList.remove('fa-angle-right');
      cardIcon.classList.add('fa-angle-down');
      cardBody.classList.remove('is-hidden');
    }, 1);
  }
}
