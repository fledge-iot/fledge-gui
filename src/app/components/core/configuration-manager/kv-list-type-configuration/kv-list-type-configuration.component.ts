import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, OnChanges, SimpleChanges, Output, ViewChild, ChangeDetectionStrategy, NgZone, ElementRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { filter, cloneDeep } from 'lodash';
import { CustomValidator } from '../../../../directives/custom-validator';
import { ConfigurationControlService, RolesService } from '../../../../services';
import { FileImportModalComponent } from '../../../common/file-import-modal/file-import-modal.component';
import { FileExportModalComponent } from '../../../common/file-export-modal/file-export-modal.component';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-kv-list-type-configuration',
  templateUrl: './kv-list-type-configuration.component.html',
  styleUrls: ['./kv-list-type-configuration.component.css']
  // Removed OnPush for debugging
})
export class KvListTypeConfigurationComponent implements OnInit, OnChanges, OnDestroy {
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
  isListView = true;

  // Simplified data storage
  allFormData: Array<{key: string, value: any}> = [];
  
  private destroy$ = new Subject<void>();
  private isInitialized = false;

  constructor(
    private zone: NgZone,
    public cdRef: ChangeDetectorRef,
    public rolesService: RolesService,
    public configControlService: ConfigurationControlService,
    private fb: FormBuilder
  ) {
    this.kvListItemsForm = this.fb.group({
      kvListItems: this.fb.array([])
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.configuration && this.configuration) {
      if (this.isInitialized) {
        this.loadData();
      }
    }
  }

  ngOnInit() {
    if (this.configuration) {
      this.loadData();
      this.setupValueChangeSubscription();
    }
    this.isInitialized = true;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData() {
    if (!this.configuration) {
      return;
    }

    let kvlistValue = this.configuration?.value ?? this.configuration.default ?? {};

    // Handle string format
    if (typeof kvlistValue === 'string') {
      try {
        kvlistValue = JSON.parse(kvlistValue);
      } catch (e) {
        kvlistValue = {};
      }
    }

    // Ensure it's an object
    if (typeof kvlistValue !== 'object' || kvlistValue === null || Array.isArray(kvlistValue)) {
      kvlistValue = {};
    }

    const entries = Object.entries(kvlistValue);

    // Store all data
    this.allFormData = entries.map(([key, value]) => ({ key, value }));
    
    // Create form controls for all items
    this.createFormControls();
    
    this.cdRef.detectChanges(); // Force change detection
  }

  private createFormControls() {
    const formArray = this.kvListItems;
    formArray.clear();

    this.allFormData.forEach(item => {
      const formGroup = this.createItemFormGroup(item);
      formArray.push(formGroup);
      this.items.push({ status: true });
      this.initialProperties.push({});
    });
  }

  private createItemFormGroup(item: {key: string, value: any}): FormGroup {
    return this.fb.group({
      key: [item.key, [Validators.required, CustomValidator.nospaceValidator]],
      value: [item.value, [Validators.required]]
    });
  }

  private setupValueChangeSubscription() {
    this.kvListItems.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        this.emitChanges(data);
      });
  }

  private emitChanges(data: any) {
    // Convert array back to object format
    const kvObject = {};
    data.forEach((item: any) => {
      if (item && item.key && item.value !== undefined) {
        kvObject[item.key] = item.value;
      }
    });

    this.changedConfig.emit({
      [this.configuration.key]: JSON.stringify(kvObject)
    });

    this.formStatusEvent.emit({
      status: this.kvListItems.valid,
      group: this.group
    });

    // Trigger change detection to update export data
    this.cdRef.detectChanges();
  }

  get kvListItems() {
    return this.kvListItemsForm.get('kvListItems') as FormArray;
  }

  // Export data getter - converts form array to object format for export
  get exportData() {
    if (!this.kvListItems || this.kvListItems.length === 0) {
      return {};
    }
    
    const result = {};
    this.kvListItems.controls.forEach(control => {
      const value = control.value;
      if (value && value.key && value.value !== undefined) {
        result[value.key] = value.value;
      }
    });
    
    return result;
  }

  addListItem(isPrepend: boolean = false) {
    const newItem = { key: '', value: '' };
    const newFormGroup = this.createItemFormGroup(newItem);

    if (isPrepend) {
      this.allFormData.unshift(newItem);
      this.kvListItems.insert(0, newFormGroup);
      this.items.unshift({ status: true });
      this.initialProperties.unshift({});
    } else {
      this.allFormData.push(newItem);
      this.kvListItems.push(newFormGroup);
      this.items.push({ status: true });
      this.initialProperties.push({});
    }

    this.cdRef.markForCheck();
  }

  removeListItem(index: number) {
    if (index >= 0 && index < this.kvListItems.controls.length) {
      this.allFormData.splice(index, 1);
      this.kvListItems.removeAt(index);
      this.items.splice(index, 1);
      this.initialProperties.splice(index, 1);
      
      this.cdRef.markForCheck();
    }
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  // Modal methods
  openModal() {
    this.fileImportModal.toggleModal(true);
  }

  openExportFileModal() {
    this.fileExportModal.toggleModal(true);
  }

  // File import/export methods
  onAppendFile(event: any) {
    this.handleFileImport(event, 'append');
  }

  onOverrideFile(event: any) {
    this.handleFileImport(event, 'override');
  }

  private handleFileImport(event: any, mode: 'append' | 'override') {
    const fileData = event.fileData;
    console.log(`📂 KV Import ${mode}:`, fileData);
    
    if (!fileData) {
      console.warn('No file data provided');
      return;
    }

    let importedData: Array<{key: string, value: any}> = [];

    // Handle different data formats
    if (typeof fileData === 'object' && !Array.isArray(fileData)) {
      // Object format: {key1: value1, key2: value2} or {key1: {prop: val}, key2: {prop: val}}
      Object.entries(fileData).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // If value is an object, convert it to a string or take the first property
          const firstKey = Object.keys(value)[0];
          importedData.push({
            key: key,
            value: value[firstKey] || JSON.stringify(value)
          });
        } else {
          importedData.push({
            key: key,
            value: value
          });
        }
      });
    } else if (Array.isArray(fileData)) {
      // Array format: [{key: 'key1', value: 'val1'}, {key: 'key2', value: 'val2'}]
      fileData.forEach(item => {
        if (item.key && item.value !== undefined) {
          importedData.push({
            key: item.key,
            value: item.value
          });
        }
      });
    }

    if (importedData.length === 0) {
      console.warn('No valid data found in import file');
      return;
    }

    if (mode === 'override') {
      // Clear existing data
      this.allFormData = [];
      this.kvListItems.clear();
      this.items = [];
      this.initialProperties = [];
    }

    // Add imported data
    importedData.forEach(item => {
      this.allFormData.push(item);
      
      const formGroup = this.createItemFormGroup(item);
      this.kvListItems.push(formGroup);
      this.items.push({ status: true });
      this.initialProperties.push({});
    });

    console.log(`✅ Import complete: ${mode}ed ${importedData.length} items. Total: ${this.kvListItems.controls.length}`);
    this.cdRef.detectChanges();
  }

  // Legacy methods for template compatibility
  setChildConfigFormValidity() {
    this.validConfigurationForm = !this.items.find(item => item.status === false);
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

  // Status handling
  formStatus(formState: any, index: number) {
    if (this.items[index]) {
      this.items[index].status = formState.status;
    }
    this.setChildConfigFormValidity();
    this.formStatusEvent.emit({
      status: this.kvListItems.valid && this.validConfigurationForm,
      group: this.group
    });
  }

  // Missing methods that template expects
  getChangedConfiguration(index: number, data: any) {
    // Update the form control at the given index
    if (this.kvListItems.controls[index]) {
      this.kvListItems.controls[index].patchValue(data);
    }
  }

  setCurrentView(event: any) {
    this.isListView = event.isListView;
    this.cdRef.markForCheck();
  }

  expandAllItems() {
    // For object items, this would expand all cards
  }

  collapseAllItems() {
    // For object items, this would collapse all cards
  }

  // Properties for debugging and compatibility
  get isLoadingMore() {
    return false; // Simplified - no virtual scrolling for now
  }

  // Test method to generate large datasets for performance testing
  generateTestData(count: number = 5000) {
    console.log(`🧪 Generating ${count} test records for performance testing...`);
    const startTime = performance.now();
    
    // Clear existing data
    this.allFormData = [];
    this.kvListItems.clear();
    this.items = [];
    this.initialProperties = [];

    // Generate test data
    for (let i = 1; i <= count; i++) {
      const testItem = {
        key: `outstation_${i.toString().padStart(4, '0')}`,
        value: `station_address_${i}`
      };
      
      this.allFormData.push(testItem);
      
      const formGroup = this.createItemFormGroup(testItem);
      this.kvListItems.push(formGroup);
      this.items.push({ status: true });
      this.initialProperties.push({});
    }

    const endTime = performance.now();
    console.log(`✅ Generated ${count} test records in ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`📊 Total KV pairs: ${this.kvListItems.controls.length}`);
    
    this.cdRef.detectChanges();
    
    // Show success message
    console.log(`🎯 Test data ready for export. Use the export button to test with ${count} records.`);
  }
}
