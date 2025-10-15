import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { filter } from 'lodash';
import { CustomValidator } from '../../../../directives/custom-validator';
import { cloneDeep } from 'lodash';
import { ConfigurationControlService, RolesService, SharedService } from '../../../../services';
import { FileImportModalComponent } from '../../../common/file-import-modal/file-import-modal.component';
import { FileExportModalComponent } from '../../../common/file-export-modal/file-export-modal.component';
import { Subscription } from 'rxjs';
import { DelimiterStoreService } from '../../../../services/delimiter-store.service';

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
    private sharedService: SharedService,
    private delimiterStoreService: DelimiterStoreService) {
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
    this.csvDelimiter = event.delimiter ?? ',';
    this.delimiterStoreService.setDelimiter(this.csvDelimiter);
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
    this.csvDelimiter = event.delimiter ?? ',';
    this.delimiterStoreService.setDelimiter(this.csvDelimiter);
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

  public onDelimiterChanged(delimiter: string) {
    this.csvDelimiter = delimiter;
    this.delimiterStoreService.setDelimiter(delimiter);
    this.csvEditorData = this.getCsvFromForm();
    this.cdRef.detectChanges();
    this.formStatusEvent.emit({ 'status': this.kvListItems.valid && this.validConfigurationForm, 'group': this.group });
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
    this.csvDelimiter = this.delimiterStoreService.getDelimiter() ?? this.csvDelimiter ?? ',';
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

  private setError(message: string): void {
    this.editorErrorMessage = message;
    this.validConfigurationForm = false;
    this.formStatusEvent.emit({ status: false, group: this.group });
  }

  private setSuccess(): void {
    this.editorErrorMessage = '';
    this.validConfigurationForm = true;
  }

  public onJsonEditorChange(text: string) {
    this.jsonEditorData = text;
    try {
      const parsed = JSON.parse(text || '{}');

      // Case 1: JSON empty
      if (!parsed || Object.keys(parsed).length === 0) {
        this.setError('Empty JSON file.');
        return;
      }

      // Must be a non-array object
      if (!(parsed && typeof parsed === 'object' && !Array.isArray(parsed))) {
        this.setError('Invalid JSON format. Root must be an object.');
        return;
      }

      // Reset lists
      this.setSuccess();
      this.kvListItems.clear();
      this.initialProperties = [];
      this.items = [];

      const requiredProps = Object.keys(this.configuration.properties);

      for (const [key, value] of Object.entries(parsed)) {
        const rowLine = `Key "${key}"`;

        if (!key?.trim()) {
          this.setError('Missing required "Key".');
          return;
        }

        if (!(value && typeof value === 'object' && !Array.isArray(value))) {
          this.setError(`${rowLine} has invalid value. Expected an object with properties (${requiredProps.join(', ')}).`);
          return;
        }

        const missingProps = requiredProps.filter(p => !(p in value));
        if (missingProps.length > 0) {
          this.setError(`${rowLine} is missing required properties: ${missingProps.join(', ')}.`);
          return;
        }

        const extraProps = Object.keys(value).filter(p => !requiredProps.includes(p));
        if (extraProps.length > 0) {
          this.setError(`${rowLine} has extra invalid properties: ${extraProps.join(', ')}.`);
          return;
        }

        this.kvListItems.push(this.initListItem(false, { key, value }));
      }


      this.setSuccess();
      this.cdRef.detectChanges();
      this.formStatusEvent.emit({
        status: this.kvListItems.valid && this.validConfigurationForm,
        group: this.group
      });

    } catch (error: any) {
      this.setError('Invalid JSON: ' + error.message);
    }
  }

  public onCsvEditorChange(text: string) {
    try {
      this.csvEditorData = text ?? '';
      const raw = this.csvEditorData.trim();
      if (!raw) {
        this.setError('Empty file or invalid CSV format.');
        return;
      }

      const lines = raw.split(/\r?\n/).filter(Boolean);
      if (lines.length === 0) return;

      const headerLine = lines.shift() || '';
      const delimiter = this.detectCsvDelimiter(headerLine);
      if (!delimiter) {
        this.setError('Invalid CSV format. Use comma, semicolon, tab, pipe or colon as delimiter.');
        return;
      }

      this.csvDelimiter = delimiter;
      const headers = headerLine.split(delimiter);

      if (this.configuration.items === 'object') {
        const expected = ['Key', ...Object.keys(this.configuration.properties)];

        if (headers.length !== expected.length) {
          this.setError(`Header count mismatch: CSV has ${headers.length} columns but expected ${expected.length} (${expected.join(', ')})`);
          return;
        }

        if (!expected.every(h => headers.includes(h))) {
          this.setError(`Header mismatch: CSV has columns (${headers.join(', ')}) but expected (${expected.join(', ')})`);
          return;
        }

        if (lines.length === 0) {
          this.setError(`Missing required "Key" value at line 2.`);
          return;
        }

        for (let i = 0; i < lines.length; i++) {
          let cols = lines[i].split(delimiter);

          while (cols.length < headers.length) cols.push('');
          if (cols.length > headers.length) {
            this.setError(`Invalid data format at line ${i + 1}. Found ${cols.length} columns, expected ${headers.length}.`);
            return;
          }

          const key = (cols[0] || '').trim();
          if (!key) {
            this.setError(`Missing required "Key" value at line ${i + 2}.`);
            return;
          }

          lines[i] = cols.join(delimiter);
        }

        this.kvListItems.clear();
        this.initialProperties = [];
        this.items = [];

        lines.forEach(line => {
          const cols = line.split(delimiter);
          const key = cols[0];
          const value: any = {};
          Object.keys(this.configuration.properties).forEach((h, idx) => {
            value[h] = cols[idx + 1] ?? '';
          });
          this.kvListItems.push(this.initListItem(false, { key, value }));
        });

        this.setSuccess();
        this.cdRef.detectChanges();
        this.formStatusEvent.emit({
          status: this.kvListItems.valid && this.validConfigurationForm,
          group: this.group
        });
      }
    } catch (error: any) {
      this.setError('Invalid CSV: ' + error.message);
    }
  }

  private detectCsvDelimiter(headerLine: string): string | null {
    const candidates = [',', ';', '\t', '|', ':'];
    const detected = candidates.filter(d => headerLine.includes(d));

    if (detected.length === 1) {
      this.delimiterStoreService.setDelimiter(detected[0]);
      return detected[0];
    }

    // ambiguous or none found → reset store
    this.delimiterStoreService.setDelimiter(null);
    return null;
  }


  ngOnDestroy() {
    this.viewChangeSub?.unsubscribe();
  }
}
