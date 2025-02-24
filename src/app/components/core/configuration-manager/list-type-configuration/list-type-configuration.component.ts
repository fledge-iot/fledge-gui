import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective } from '@angular/forms';
import { filter, uniqWith, isEqual } from 'lodash';
import { CustomValidator } from '../../../../directives/custom-validator';
import { cloneDeep } from 'lodash';
import { ConfigurationControlService, RolesService } from '../../../../services';
import { FileImportModalComponent } from '../../../common/file-import-modal/file-import-modal.component';
import { FileExportModalComponent } from '../../../common/file-export-modal/file-export-modal.component';

@Component({
  selector: 'app-list-type-configuration',
  templateUrl: './list-type-configuration.component.html',
  styleUrls: ['./list-type-configuration.component.css']
})
export class ListTypeConfigurationComponent implements OnInit {
  @Input() configuration;
  @Input() categoryName;
  @Input() group: string = '';
  @Input() from = '';
  @Output() changedConfig = new EventEmitter<any>();
  @Output() formStatusEvent = new EventEmitter<any>();
  @ViewChild(FileImportModalComponent, { static: true }) fileImportModal: FileImportModalComponent;
  @ViewChild(FileExportModalComponent, { static: true }) fileExportModal: FileExportModalComponent;
  listItemsForm: FormGroup;
  initialProperties = [];
  items = [];
  listLabel: string;
  firstKey: string;
  validConfigurationForm = true;
  listValues;
  isListView = true;

  constructor(
    public cdRef: ChangeDetectorRef,
    public rolesService: RolesService,
    public configControlService: ConfigurationControlService,
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
    if (this.configuration.listName) {
      values = values[this.configuration.listName];
    }
    values.forEach(element => {
      this.initListItem(false, element);
    });
    this.onControlValueChanges();
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
      let groupConfigurations = this.configControlService.createConfigurationBase(objectConfig);
      listItem = this.configControlService.toFormGroup(objectConfig, groupConfigurations);
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
    if (this.configuration.items == 'object' && !this.isListView) {
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
        for (let [index, property] of this.initialProperties.entries()) {
          for (let [key, prop] of Object.entries(property)) {
            let val = prop as any
            val.value = value?.[index]?.[key];
          }
        }
      }
      value = uniqWith(value, isEqual);
      this.changedConfig.emit({ [this.configuration.key]: JSON.stringify(value) });
      this.formStatusEvent.emit({ 'status': this.listItems.valid, 'group': this.group });
    })
  }

  getChangedConfiguration(index, propertyChangedValues: any) {
    this.listItems.controls[index].patchValue(propertyChangedValues);
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

  appendFileData(event) {
    event.fileData.forEach(element => {
      this.initListItem(false, element);
    });
  }

  overrideFileData(event) {
    this.listItems.clear();
    this.initialProperties = [];
    event.fileData.forEach(element => {
      this.initListItem(false, element);
    });
  }

  openModal() {
    this.hideDropDown();
    this.fileImportModal.toggleModal(true);
  }

  openExportFileModal() {
    this.hideDropDown();
    this.listValues = this.listItems.value;
    this.listValues = uniqWith(this.listValues, isEqual);
    this.fileExportModal.toggleModal(true);
  }

  toggleDropdown() {
    const dropDown = document.getElementById('export-dropdown-' + this.configuration?.key);
    if (dropDown) {
      dropDown.classList.toggle('is-active');
    }
  }

  hideDropDown() {
    const dropdown = document.getElementById('export-dropdown-' + this.configuration?.key);
    if (dropdown && dropdown.classList.contains('is-active')) {
      dropdown.classList.toggle('is-active');
    }
  }

  setCurrentView(event) {
    this.isListView = event.isListView;
    if (this.listItems.length == 1 && !this.isListView) {
      this.expandListItem(0); // Expand the list if only one item is present
    }
  }
}
