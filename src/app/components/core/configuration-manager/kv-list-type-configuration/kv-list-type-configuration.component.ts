import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { filter } from 'lodash';
import { CustomValidator } from '../../../../directives/custom-validator';
import { cloneDeep } from 'lodash';
import { ConfigurationControlService, RolesService, SharedService } from '../../../../services';
import { FileImportModalComponent } from '../../../common/file-import-modal/file-import-modal.component';
import { FileExportModalComponent } from '../../../common/file-export-modal/file-export-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-kv-list-type-configuration',
  templateUrl: './kv-list-type-configuration.component.html',
  styleUrls: ['./kv-list-type-configuration.component.css']
})
export class KvListTypeConfigurationComponent implements OnInit, OnDestroy {
  @Input() configuration;
  @Input() categoryName;
  @Input() group: string = '';
  @Input() from = '';
  @Output() changedConfig = new EventEmitter<any>();
  @Output() formStatusEvent = new EventEmitter<any>();
  @ViewChild(FileImportModalComponent, { static: true }) fileImportModal: FileImportModalComponent;
  @ViewChild(FileExportModalComponent, { static: true }) fileExportModal: FileExportModalComponent;
  kvListItemsForm: FormGroup;
  initialProperties = [];
  items = [];
  validConfigurationForm = true;
  kvlistValues = {};
  currentView: 'list' | 'detailed' | 'json' | 'csv' = 'list';
  jsonEditorData = '';
  csvEditorData = '';
  csvDelimiter: string = ',';
  editorErrorMessage = '';
  private viewChangeSub: Subscription;

  constructor(
    public cdRef: ChangeDetectorRef,
    public rolesService: RolesService,
    public configControlService: ConfigurationControlService,
    private fb: FormBuilder,
    private sharedService: SharedService) {
    this.kvListItemsForm = this.fb.group({
      kvListItems: this.fb.array([])
    });
  }

  ngOnInit() {
    let values = this.configuration?.value ? this.configuration.value : this.configuration.default;
    values = JSON.parse(values) as [];
    for (const [key, value] of Object.entries(values)) {
      this.kvListItems.push(this.initListItem(false, { key, value }));
    }
    this.onControlValueChanges();

    this.viewChangeSub = this.sharedService.listKvView.subscribe((view) => {
      this.applyView(view as 'list' | 'detailed' | 'json' | 'csv');
    });
  }

  get kvListItems() {
    return this.kvListItemsForm.get('kvListItems') as FormArray;
  }

  initListItem(isPrepend, param) {
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
      if (isPrepend) {
        this.initialProperties.unshift(objectConfig);
        this.items.unshift({ status: true });
      }
      else {
        this.initialProperties.push(objectConfig);
        this.items.push({ status: true });
      }
      let groupConfigurations = this.configControlService.createConfigurationBase(objectConfig);
      let kvListItem = this.configControlService.toFormGroup(objectConfig, groupConfigurations);
      return this.fb.group({
        key: [param?.key, [Validators.required, CustomValidator.nospaceValidator]],
        value: kvListItem
      });
    }
    return this.fb.group({
      key: [param?.key, [Validators.required, CustomValidator.nospaceValidator]],
      value: [param?.value, CustomValidator.nospaceValidator]
    });
  }

  addListItem(isPrepend) {
    const controlsLength = this.kvListItems.length;
    const listSize = this.configuration?.listSize > 0 ? +this.configuration.listSize : 9999; // max threshold limit for new item creation
    if (controlsLength > listSize) {
      return;
    }
    if (isPrepend) {
      this.kvListItems.insert(0, this.initListItem(isPrepend, { key: '', value: '' }));
    }
    else {
      this.kvListItems.push(this.initListItem(isPrepend, { key: '', value: '' }));
    }
    this.formStatusEvent.emit({ 'status': this.kvListItems.valid, 'group': this.group });
    if (this.configuration.items == 'object') {
      const index = isPrepend ? 0 : this.kvListItems.length - 1;
      if (this.currentView === 'list') {
        this.scrollToRow(index);
      } else {
        // Expand newly added item
        this.expandListItem(index);
      }
    }
  }

  scrollToRow(i) {
    setTimeout(() => {
      let row = document.getElementById(`table-row-${this.configuration.key}-${i}-${this.from}`);
      let input: HTMLElement = row.querySelector('.input.is-small');
      if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        input.focus();
      }
    }, 1);
  }

  removeListItem(index: number) {
    this.kvListItems.removeAt(index);
    this.initialProperties.splice(index, 1);
    this.items.splice(index, 1);
    this.setChildConfigFormValidity();
  }

  onControlValueChanges(): void {
    this.kvListItems.valueChanges.subscribe((data) => {
      // remove empty, undefined, null values
      data = filter((data), (d: any) => d.key && d.key.trim() !== ''); // remove empty, undefined, null values
      const transformedObject = {};
      data.forEach((item, index) => {
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
          let property = this.initialProperties[index]
          for (let [key, prop] of Object.entries(property)) {
            let val = prop as any
            val.value = itemValue[key];
          }
        }
        transformedObject[item.key] = itemValue;
      });
      this.changedConfig.emit({ [this.configuration.key]: JSON.stringify(transformedObject) });
      this.formStatusEvent.emit({ 'status': this.kvListItems.valid, 'group': this.group });
    })
  }

  getChangedConfiguration(index: string, propertyChangedValues: any) {
    this.kvListItems.controls[index].controls['value'].patchValue(propertyChangedValues);
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
      this.expandCollapseSingleItem(index, true, true);
    }, 1);
  }

  expandCollapseSingleItem(i: number, isExpand: boolean, scrollIntoView = false) {
    let cardHeader = document.getElementById('card-header-' + this.configuration.key + '-' + i + '-' + this.from);
    let cardBody = document.getElementById('card-content-' + this.configuration.key + '-' + i + '-' + this.from);
    if (isExpand) {
      cardHeader.classList.add('is-hidden');
      cardBody.classList.remove('is-hidden');
      if (scrollIntoView) {
        let input: HTMLElement = cardBody.querySelector('.input.is-small');
        if (input) {
          input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          input.focus();
        }
      }
    }
    else {
      cardHeader.classList.remove('is-hidden');
      cardBody.classList.add('is-hidden');
    }
  }

  expandAllItems() {
    for (let i = 0; i < this.kvListItems.length; i++) {
      this.expandCollapseSingleItem(i, true);
    }
  }

  collapseAllItems() {
    for (let i = 0; i < this.kvListItems.length; i++) {
      this.expandCollapseSingleItem(i, false);
    }
  }

  appendFileData(event) {
    for (const [key, value] of Object.entries(event.fileData)) {
      this.kvListItems.push(this.initListItem(false, { key, value }));
    }
    if (this.currentView === 'json') {
      this.jsonEditorData = this.getJsonFromForm();
    }
    if (this.currentView === 'csv') {
      this.csvEditorData = this.getCsvFromForm();
    }
  }

  overrideFileData(event) {
    this.kvListItems.clear();
    this.initialProperties = [];
    for (const [key, value] of Object.entries(event.fileData)) {
      this.kvListItems.push(this.initListItem(false, { key, value }));
    }
    if (this.currentView === 'json') {
      this.jsonEditorData = this.getJsonFromForm();
    }
    if (this.currentView === 'csv') {
      this.csvEditorData = this.getCsvFromForm();
    }
  }

  openModal() {
    this.hideDropDown();
    this.fileImportModal.toggleModal(true);
  }

  openExportFileModal() {
    this.hideDropDown();
    for (let [ind, val] of this.kvListItems.value.entries()) {
      this.kvlistValues[val.key] = val.value;
    }
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
    this.applyView(event as 'list' | 'detailed' | 'json' | 'csv');
    this.sharedService.listKvView.next(this.currentView);
  }

  private applyView(view: 'list' | 'detailed' | 'json' | 'csv') {
    this.currentView = view;
    this.editorErrorMessage = '';
    this.validConfigurationForm = true;
    this.formStatusEvent.emit({ 'status': this.kvListItems.valid && this.validConfigurationForm, 'group': this.group });
    if (this.currentView === 'json') {
      this.jsonEditorData = this.getJsonFromForm();
    } else if (this.currentView === 'csv') {
      this.csvEditorData = this.getCsvFromForm();
    }
    if (this.kvListItems.length == 1 && this.currentView === 'detailed') {
      this.expandListItem(0);
    }
  }

  // ===== Synchronization helpers for kvlist =====
  private getJsonFromForm(): string {
    if (this.configuration.items === 'object') {
      const obj = {} as any;
      this.kvListItems.value.forEach((row: any) => { obj[row.key] = row.value; });
      return JSON.stringify(obj, null, 2);
    }
    const obj = {} as any;
    this.kvListItems.value.forEach((row: any) => { obj[row.key] = row.value; });
    return JSON.stringify(obj, null, 2);
  }

  private getCsvFromForm(): string {
    if (this.configuration.items === 'object') {
      const headers = Object.keys(this.configuration.properties);
      const rows = this.kvListItems.value.map((row: any) => {
        const values = headers.map(h => `${row.value?.[h] ?? ''}`).join(this.csvDelimiter);
        return `${row.key}${this.csvDelimiter}${values}`;
      });
      return ['Key' + this.csvDelimiter + headers.join(this.csvDelimiter), ...rows].join('\n');
    }
    const rows = this.kvListItems.value.map((row: any) => `${row.key}${this.csvDelimiter}${row.value ?? ''}`);
    return ['Key' + this.csvDelimiter + 'value', ...rows].join('\n');
  }

  public onJsonEditorChange(text: string) {
    this.jsonEditorData = text;
    try {
      const parsed = JSON.parse(text || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        this.editorErrorMessage = '';
        this.validConfigurationForm = true;
        this.kvListItems.clear();
        this.initialProperties = [];
        this.items = [];
        for (const [key, value] of Object.entries(parsed)) {
          this.kvListItems.push(this.initListItem(false, { key, value }));
        }
        this.cdRef.detectChanges();
        this.formStatusEvent.emit({ 'status': this.kvListItems.valid && this.validConfigurationForm, 'group': this.group });
      } else {
        this.editorErrorMessage = 'Invalid JSON format.';
        this.validConfigurationForm = false;
        this.formStatusEvent.emit({ 'status': false, 'group': this.group });
      }
    } catch (_) {
      this.editorErrorMessage = 'Invalid JSON format.';
      this.validConfigurationForm = false;
      this.formStatusEvent.emit({ 'status': false, 'group': this.group });
    }
  }

  public onCsvEditorChange(text: string) {
    this.csvEditorData = text ?? '';
    const raw = (this.csvEditorData || '').trim();
    if (!raw) { return; }
    const lines = raw.split(/\r?\n/).filter(l => l.length > 0);
    if (lines.length === 0) { return; }
    const headerLine = (lines.shift() || '');
    const delimiter = this.detectCsvDelimiter(headerLine);
    if (!delimiter) {
      this.editorErrorMessage = 'Invalid CSV format. Use comma or tab as delimiter.';
      this.validConfigurationForm = false;
      this.formStatusEvent.emit({ 'status': false, 'group': this.group });
      return;
    }
    this.csvDelimiter = delimiter;
    const headers = headerLine.split(delimiter);
    if (this.configuration.items === 'object') {
      const expected = ['Key', ...Object.keys(this.configuration.properties)];
      if (headers.length !== expected.length || !expected.every(h => headers.indexOf(h) > -1)) {
        this.editorErrorMessage = delimiter === '\t' ? 'Invalid tab-delimited CSV format.' : 'Invalid CSV format. Use comma or tab as delimiter.';
        this.validConfigurationForm = false;
        this.formStatusEvent.emit({ 'status': false, 'group': this.group });
        return;
      }
      // validate each row has consistent columns
      for (const line of lines) {
        if (line.split(delimiter).length !== headers.length) {
          this.editorErrorMessage = delimiter === '\t' ? 'Invalid tab-delimited CSV format.' : 'Invalid CSV format. Use comma or tab as delimiter.';
          this.validConfigurationForm = false;
          this.formStatusEvent.emit({ 'status': false, 'group': this.group });
          return;
        }
      }
      this.kvListItems.clear();
      this.initialProperties = [];
      this.items = [];
      lines.forEach(line => {
        const cols = line.split(delimiter);
        const key = cols[0];
        const value: any = {};
        Object.keys(this.configuration.properties).forEach((h, idx) => value[h] = cols[idx + 1] ?? '');
        this.kvListItems.push(this.initListItem(false, { key, value }));
      });
      this.editorErrorMessage = '';
      this.validConfigurationForm = true;
      this.cdRef.detectChanges();
      this.formStatusEvent.emit({ 'status': this.kvListItems.valid && this.validConfigurationForm, 'group': this.group });
    } else {
      if (headers.length !== 2) {
        this.editorErrorMessage = 'Invalid CSV format. Use comma or tab as delimiter.';
        this.validConfigurationForm = false;
        this.formStatusEvent.emit({ 'status': false, 'group': this.group });
        return;
      }
      for (const line of lines) {
        if (line.split(delimiter).length !== 2) {
          this.editorErrorMessage = 'Invalid CSV format. Use comma or tab as delimiter.';
          this.validConfigurationForm = false;
          this.formStatusEvent.emit({ 'status': false, 'group': this.group });
          return;
        }
      }
      this.kvListItems.clear();
      lines.forEach(line => {
        const cols = line.split(delimiter);
        this.kvListItems.push(this.initListItem(false, { key: cols[0], value: cols[1] ?? '' }));
      });
      this.editorErrorMessage = '';
      this.validConfigurationForm = true;
      this.cdRef.detectChanges();
      this.formStatusEvent.emit({ 'status': this.kvListItems.valid && this.validConfigurationForm, 'group': this.group });
    }
  }

  private detectCsvDelimiter(headerLine: string): string | null {
    const hasComma = headerLine.includes(',');
    const hasTab = headerLine.includes('\t');
    if ((hasComma && hasTab) || (!hasComma && !hasTab)) {
      return null;
    }
    return hasTab ? '\t' : ',';
  }

  ngOnDestroy() {
    this.viewChangeSub?.unsubscribe();
  }
}
