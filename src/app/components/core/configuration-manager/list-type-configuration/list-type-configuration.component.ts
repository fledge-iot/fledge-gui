import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { filter, uniqWith, isEqual, cloneDeep } from 'lodash';
import { CustomValidator } from '../../../../directives/custom-validator';
import { ConfigurationControlService, RolesService } from '../../../../services';
import { FileImportModalComponent } from '../../../common/file-import-modal/file-import-modal.component';
import { FileExportModalComponent } from '../../../common/file-export-modal/file-export-modal.component';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Subscription } from 'rxjs';

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
  currentView: 'list' | 'detailed' | 'json' | 'csv' = 'list';
  jsonEditorData = '';
  csvEditorData = '';
  editorErrorMessage = '';

  @ViewChild(CdkVirtualScrollViewport, { static: false }) viewport: CdkVirtualScrollViewport;
  private valueChangeSub: Subscription;

  constructor(
    private zone: NgZone,
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
      this.listLabel = this.configuration.properties[this.firstKey]?.displayName ?? this.firstKey;
    }
    let values = this.configuration?.value ?? this.configuration.default;
    const t0 = performance.now();
    values = JSON.parse(values);

    if (this.configuration.listName) {
      values = values[this.configuration.listName];
    }

    this.cdRef.detach(); // stop Angular from detecting changes
    const chunkSize = 20;
    let i = 0;

    const processChunk = () => {
      const end = Math.min(i + chunkSize, values.length);
      for (; i < end; i++) {
        this.initListItem(false, values[i]);
      }
      if (i < values.length) {
        setTimeout(processChunk, 0); // Yield to browser/UI
      }
    };

    processChunk();

    this.cdRef.reattach(); // resume change detection
    this.cdRef.detectChanges(); // trigger only once

    const t1 = performance.now();
    console.log(`Form creation took ${t1 - t0} ms`);

    this.valueChangeSub = this.onControlValueChanges();

    const globalView = localStorage.getItem('LIST_KVLIST_VIEW') || 'list';
    this.setCurrentView(globalView);
  }

  get listItems() {
    return this.listItemsForm.get('listItems') as FormArray;
  }

  get listItemControls(): AbstractControl[] {
    return [...this.listItems.controls]; // returns a new reference
  }

  trackByIndex(index: number, _item: AbstractControl): number {
    return index;
  }

  initListItem(isPrepend: boolean, v: any = '') {
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
  }

  addListItem(isPrepend) {
    const controlsLength = this.listItems.length;
    const listSize = this.configuration?.listSize > 0 ? +this.configuration.listSize : 9999; // max threshold limit for new item creation
    if (controlsLength > listSize) {
      return;
    }
    this.initListItem(isPrepend);
    this.formStatusEvent.emit({ status: this.listItems.valid, group: this.group });
    if (this.configuration.items === 'object') {
      const index = isPrepend ? 0 : this.listItems.length - 1;
      if (this.currentView === 'list') {
        this.scrollToRow(index);
      } else {
        this.expandListItem(index);
      }
    }

    // Step 1: Trigger DOM update
    this.cdRef.detectChanges();

    // Step 2: Wait for rendering to finish
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        if (this.viewport) {
          this.viewport.checkViewportSize();

          // Step 3: Scroll after layout is fully calculated
          setTimeout(() => {
            this.viewport.scrollToIndex(this.listItems.length - 1, 'smooth');
          }, 0);
        }
      });
    });
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
    this.listItems.removeAt(index);
    this.initialProperties.splice(index, 1);
    this.items.splice(index, 1);
    this.setChildConfigFormValidity();
  }

  onControlValueChanges(): Subscription {
    return this.listItems.valueChanges
      .pipe(
        debounceTime(100), // Avoid unnecessary rapid firing
        distinctUntilChanged(isEqual), // Prevent duplicate processing
        map((value: any) => {
          // Remove empty, undefined, null values
          let filtered = filter(value);

          // Convert to float if needed
          if (this.configuration?.items === 'float') {
            filtered = filtered.map((num: any) => Number.isInteger(+num) ? Number.parseFloat(num).toFixed(1) : num
            );
          }
          // Update initial properties if items are objects
          if (this.configuration.items === 'object') {
            this.initialProperties.forEach((property, index) => {
              Object.entries(property).forEach(([key, prop]) => {
                (prop as any).value = filtered?.[index]?.[key];
              });
            });
          }

          return uniqWith(filtered, isEqual);
        })
      )
      .subscribe((processedValue) => {
        this.changedConfig.emit({
          [this.configuration.key]: JSON.stringify(processedValue),
        });

        this.formStatusEvent.emit({
          status: this.listItems.valid,
          group: this.group,
        });
      });
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
    if (this.currentView === 'json') {
      this.jsonEditorData = this.getJsonFromForm();
    }
    if (this.currentView === 'csv') {
      this.csvEditorData = this.getCsvFromForm();
    }
  }

  overrideFileData(event) {
    this.listItems.clear();
    this.initialProperties = [];
    event.fileData.forEach(element => {
      this.initListItem(false, element);
    });
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
    this.currentView = event as 'list' | 'detailed' | 'json' | 'csv';
    this.editorErrorMessage = '';
    this.validConfigurationForm = true;
    if (this.currentView === 'json') {
      this.jsonEditorData = this.getJsonFromForm();
    } else if (this.currentView === 'csv') {
      this.csvEditorData = this.getCsvFromForm();
    }
    if (this.listItems.length == 1 && this.currentView === 'detailed') {
      this.expandListItem(0); // Expand the list if only one item is present
    }

  }

  // ===== Synchronization helpers =====
  private getJsonFromForm(): string {
    if (this.configuration.items === 'object') {
      const arr = this.listItems.value || [];
      return JSON.stringify(arr, null, 2);
    }
    // primitives
    return JSON.stringify(this.listItems.value || [], null, 2);
  }

  private getCsvFromForm(): string {
    const values = this.listItems.value || [];
    if (this.configuration.items === 'object') {
      const headers = Object.keys(this.configuration.properties);
      const rows = values.map(v => headers.map(h => `${v?.[h] ?? ''}`).join(','));
      return [headers.join(','), ...rows].join('\n');
    }
    // primitives -> single column CSV with header "value"
    const header = 'value';
    const rows = (values as any[]).map(v => `${v ?? ''}`);
    return [header, ...rows].join('\n');
  }

  public onJsonEditorChange(text: string) {
    this.jsonEditorData = text;
    try {
      const parsed = JSON.parse(text || '[]');
      if (this.configuration.items === 'object') {
        if (!Array.isArray(parsed)) { return; }
        this.listItems.clear();
        this.initialProperties = [];
        this.items = [];
        parsed.forEach(el => this.initListItem(false, el));
        this.cdRef.detectChanges();
        this.editorErrorMessage = '';
        this.validConfigurationForm = true;
        this.formStatusEvent.emit({ status: this.listItems.valid && this.validConfigurationForm, group: this.group });
      } else {
        if (!Array.isArray(parsed)) { return; }
        this.listItems.clear();
        (parsed as any[]).forEach(el => this.initListItem(false, el));
        this.cdRef.detectChanges();
        this.editorErrorMessage = '';
        this.validConfigurationForm = true;
        this.formStatusEvent.emit({ status: this.listItems.valid && this.validConfigurationForm, group: this.group });
      }
    } catch (_) {
      this.editorErrorMessage = 'Invalid JSON format.';
      this.validConfigurationForm = false;
      this.formStatusEvent.emit({ status: false, group: this.group });
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
      this.formStatusEvent.emit({ status: false, group: this.group });
      return;
    }
    const headers = headerLine.split(delimiter);
    if (this.configuration.items === 'object') {
      const expected = Object.keys(this.configuration.properties);
      if (headers.length !== expected.length || !expected.every(h => headers.indexOf(h) > -1)) {
        this.editorErrorMessage = delimiter === '\t' ? 'Invalid tab-delimited CSV format.' : 'Invalid CSV format. Use comma or tab as delimiter.';
        this.validConfigurationForm = false;
        this.formStatusEvent.emit({ status: false, group: this.group });
        return;
      }
      for (const line of lines) {
        if (line.split(delimiter).length !== headers.length) {
          this.editorErrorMessage = delimiter === '\t' ? 'Invalid tab-delimited CSV format.' : 'Invalid CSV format. Use comma or tab as delimiter.';
          this.validConfigurationForm = false;
          this.formStatusEvent.emit({ status: false, group: this.group });
          return;
        }
      }
      const arr = lines.map(line => {
        const cols = line.split(delimiter);
        const obj = {} as any;
        headers.forEach((h, idx) => obj[h] = cols[idx] ?? '');
        return obj;
      });
      this.listItems.clear();
      this.initialProperties = [];
      this.items = [];
      arr.forEach(el => this.initListItem(false, el));
      this.editorErrorMessage = '';
      this.validConfigurationForm = true;
      this.cdRef.detectChanges();
      this.formStatusEvent.emit({ status: this.listItems.valid && this.validConfigurationForm, group: this.group });
    } else {
      if (headers.length !== 1) {
        this.editorErrorMessage = 'Invalid CSV format. Use comma or tab as delimiter.';
        this.validConfigurationForm = false;
        this.formStatusEvent.emit({ status: false, group: this.group });
        return;
      }
      for (const line of lines) {
        if (line.split(delimiter).length !== 1) {
          this.editorErrorMessage = 'Invalid CSV format. Use comma or tab as delimiter.';
          this.validConfigurationForm = false;
          this.formStatusEvent.emit({ status: false, group: this.group });
          return;
        }
      }
      const values = lines.map(line => line.split(delimiter)[0]);
      this.listItems.clear();
      values.forEach(v => this.initListItem(false, v));
      this.editorErrorMessage = '';
      this.validConfigurationForm = true;
      this.cdRef.detectChanges();
      this.formStatusEvent.emit({ status: this.listItems.valid && this.validConfigurationForm, group: this.group });
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
    this.valueChangeSub?.unsubscribe();
  }
}
