import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnInit, OnDestroy, OnChanges, SimpleChanges, Output, ViewChild, ChangeDetectionStrategy, ElementRef } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { filter, uniqWith, isEqual, cloneDeep } from 'lodash';
import { CustomValidator } from '../../../../directives/custom-validator';
import { ConfigurationControlService, RolesService } from '../../../../services';
import { FileImportModalComponent } from '../../../common/file-import-modal/file-import-modal.component';
import { FileExportModalComponent } from '../../../common/file-export-modal/file-export-modal.component';
import { debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-list-type-configuration',
  templateUrl: './list-type-configuration.component.html',
  styleUrls: ['./list-type-configuration.component.css']
  // Removed OnPush for debugging
})
export class ListTypeConfigurationComponent implements OnInit, OnChanges, OnDestroy {
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
  isListView = true;

  // Simplified data storage
  allFormData: any[] = [];

  private destroy$ = new Subject<void>();
  private isInitialized = false;

  constructor(
    private zone: NgZone,
    public cdRef: ChangeDetectorRef,
    public rolesService: RolesService,
    public configControlService: ConfigurationControlService,
    private fb: FormBuilder
  ) {
    console.log('🔧 LIST CONSTRUCTOR: Component being created');
    this.listItemsForm = this.fb.group({
      listItems: this.fb.array([])
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.configuration && this.configuration) {
      console.log('📋 LIST: Configuration changed:', this.configuration);
      if (this.isInitialized) {
        this.loadData();
      }
    }
  }

  ngOnInit() {
    console.log(`📋 LIST COMPONENT INIT: Group="${this.group}", Category="${this.categoryName}"`);
    console.log('📋 LIST: Initial configuration:', this.configuration);
    if (this.configuration) {
      if (this.configuration.items == 'object') {
        this.firstKey = Object.keys(this.configuration.properties)[0];
        this.listLabel = this.configuration.properties[this.firstKey]?.displayName ?? this.firstKey;
      }

      this.loadData();
      this.setupValueChangeSubscription();
    } else {
      console.warn('📋 LIST: No configuration provided on init');
    }
    this.isInitialized = true;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData() {
    if (!this.configuration) {
      console.warn('📋 LIST: loadData called but configuration is undefined');
      return;
    }

    const loadStartTime = performance.now();
    let values = this.configuration?.value ?? this.configuration.default ?? [];
    console.log(`📋 Loading data for configuration "${this.configuration.key}":`, values);

    // Handle string format
    if (typeof values === 'string') {
      try {
        values = JSON.parse(values);
      } catch (e) {
        console.error('Error parsing list values:', e);
        values = [];
      }
    }

    // Handle listName property
    if (this.configuration.listName) {
      values = values[this.configuration.listName];
    }

    // Ensure it's an array
    if (!Array.isArray(values)) {
      console.warn('📋 LIST: Invalid list value, using empty array:', values);
      values = [];
    }

    console.log(`📋 Found ${values.length} total items:`, values);

    // Store all data
    this.allFormData = values;

    this.createFormControls();
    const changeDetectionStartTime = performance.now();
    this.cdRef.detectChanges(); // Force change detection
    const changeDetectionEndTime = performance.now();

    const totalLoadTime = changeDetectionEndTime - loadStartTime;
    console.log(`⏱️ LIST: Change detection took ${(changeDetectionEndTime - changeDetectionStartTime).toFixed(2)}ms (${((changeDetectionEndTime - changeDetectionStartTime) / 1000).toFixed(3)}s)`);
    console.log(`🎯 LIST: Total data load and render time: ${totalLoadTime.toFixed(2)}ms (${(totalLoadTime / 1000).toFixed(3)}s) for ${values.length} records`);
  }

  private createFormControls() {
    const formArray = this.listItems;
    formArray.clear();

    console.log(`🔧 LIST: Creating form controls for ${this.allFormData.length} items`);
    const controlCreationStartTime = performance.now();

    this.allFormData.forEach((item) => {
      const control = this.createItemControl(item);
      formArray.push(control);
      this.items.push({ status: true });

      // Create proper initial properties for detailed view
      if (this.configuration.items === 'object') {
        let objectConfig = cloneDeep(this.configuration.properties);
        for (let [key, val] of Object.entries(item)) {
          if (objectConfig[key]) {
            objectConfig[key].value = val;
          }
        }
        this.initialProperties.push(objectConfig);
      } else {
        this.initialProperties.push({});
      }
    });

    const controlCreationEndTime = performance.now();
    console.log(`⏱️ LIST: All form controls created in ${(controlCreationEndTime - controlCreationStartTime).toFixed(2)}ms (${((controlCreationEndTime - controlCreationStartTime) / 1000).toFixed(3)}s)`);
  }

  private createItemControl(item: any): AbstractControl {
    if (this.configuration.items === 'object') {
      // Create object configuration for form group
      let objectConfig = cloneDeep(this.configuration.properties);
      for (let [key, val] of Object.entries(item)) {
        objectConfig[key].value = val;
      }
      let groupConfigurations = this.configControlService.createConfigurationBase(objectConfig);
      return this.configControlService.toFormGroup(objectConfig, groupConfigurations);
    } else {
      return this.fb.control(item, [CustomValidator.nospaceValidator]);
    }
  }

  private setupValueChangeSubscription() {
    this.listItems.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(isEqual),
        takeUntil(this.destroy$),
        map((value: any) => {
          // Remove empty, undefined, null values
          let filtered = filter(value);

          // Convert to float if needed
          if (this.configuration?.items === 'float') {
            filtered = filtered.map((num: any) =>
              Number.isInteger(+num) ? Number.parseFloat(num).toFixed(1) : num
            );
          }

          return uniqWith(filtered, isEqual);
        })
      )
      .subscribe((processedValue) => {
        this.emitChanges(processedValue);
      });
  }

  private emitChanges(processedValue: any) {
    this.changedConfig.emit({
      [this.configuration.key]: JSON.stringify(processedValue),
    });

    this.formStatusEvent.emit({
      status: this.listItems.valid,
      group: this.group,
    });

    // Trigger change detection to update export data
    this.cdRef.detectChanges();
  }

  get listItems() {
    return this.listItemsForm.get('listItems') as FormArray;
  }

  // Export data getter - converts form array to array format for export
  get exportData() {
    if (!this.listItems || this.listItems.length === 0) {
      return [];
    }

    if (this.configuration.items === 'object') {
      // For object items, extract the values from each form group
      return this.listItems.controls.map(control => {
        return control.value;
      });
    } else {
      // For simple items, just return the values
      return this.listItems.controls.map(control => control.value);
    }
  }

  addListItem(isPrepend: boolean = false) {
    const addItemStartTime = performance.now();

    // Create new item
    let newItem;
    if (this.configuration.items === 'object') {
      newItem = {};
      Object.keys(this.configuration.properties).forEach(key => {
        newItem[key] = this.configuration.properties[key].default || '';
      });
    } else {
      newItem = this.configuration.default || '';
    }

    const newControl = this.createItemControl(newItem);

    // Create proper initial properties for new item
    let newInitialProperty = {};
    if (this.configuration.items === 'object') {
      let objectConfig = cloneDeep(this.configuration.properties);
      for (let [key, val] of Object.entries(newItem)) {
        if (objectConfig[key]) {
          objectConfig[key].value = val;
        }
      }
      newInitialProperty = objectConfig;
    }

    if (isPrepend) {
      this.allFormData.unshift(newItem);
      this.listItems.insert(0, newControl);
      this.items.unshift({ status: true });
      this.initialProperties.unshift(newInitialProperty);
    } else {
      this.allFormData.push(newItem);
      this.listItems.push(newControl);
      this.items.push({ status: true });
      this.initialProperties.push(newInitialProperty);
    }

    this.cdRef.markForCheck();

    const addItemEndTime = performance.now();
    console.log(`📋 Added new list item. Total: ${this.listItems.controls.length}`);
    console.log(`⏱️ LIST: Add item operation took ${(addItemEndTime - addItemStartTime).toFixed(2)}ms (${((addItemEndTime - addItemStartTime) / 1000).toFixed(6)}s)`);
  }

  removeListItem(index: number) {
    if (index >= 0 && index < this.listItems.controls.length) {
      this.allFormData.splice(index, 1);
      this.listItems.removeAt(index);
      this.items.splice(index, 1);
      this.initialProperties.splice(index, 1);

      this.cdRef.markForCheck();
      console.log(`📋 Removed list item at index ${index}. Total: ${this.listItems.controls.length}`);
    }
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  trackByFormControl(index: number, item: any): any {
    return index;
  }

  // Legacy methods for compatibility with existing template
  setCurrentView(event: any) {
    this.isListView = event.isListView;
    this.cdRef.detectChanges();
  }

  expandAllItems() {
    // For object items, this would expand all cards
    console.log('Expand all items');
  }

  collapseAllItems() {
    // For object items, this would collapse all cards
    console.log('Collapse all items');
  }

  openModal() {
    this.fileImportModal.toggleModal(true);
  }

  openExportFileModal() {
    this.fileExportModal.toggleModal(true);
  }

  onAppendFile(event: any) {
    this.handleFileImport(event, 'append');
  }

  onOverrideFile(event: any) {
    this.handleFileImport(event, 'override');
  }

  private handleFileImport(event: any, mode: 'append' | 'override') {
    const importStartTime = performance.now();
    const fileData = event.fileData;
    console.log(`📂 List Import ${mode}:`, fileData);
    console.log(`⏱️ LIST: Starting ${mode} import operation`);

    if (!fileData) {
      console.warn('No file data provided');
      return;
    }

    let importedData: any[] = [];

    // Handle different data formats
    if (Array.isArray(fileData)) {
      // Array format: [{prop1: val1, prop2: val2}, ...] or ['item1', 'item2', ...]
      importedData = fileData;
    } else if (typeof fileData === 'object' && fileData !== null) {
      // Object format - convert to array
      importedData = Object.values(fileData);
    }

    if (importedData.length === 0) {
      console.warn('No valid data found in import file');
      return;
    }

    if (mode === 'override') {
      // Clear existing data
      this.allFormData = [];
      this.listItems.clear();
      this.items = [];
      this.initialProperties = [];
    }

    // Add imported data
    importedData.forEach(item => {
      this.allFormData.push(item);

      const control = this.createItemControl(item);
      this.listItems.push(control);
      this.items.push({ status: true });
      this.initialProperties.push({});
    });

    const importEndTime = performance.now();
    const totalImportTime = importEndTime - importStartTime;

    console.log(`✅ Import complete: ${mode}ed ${importedData.length} items. Total: ${this.listItems.controls.length}`);
    console.log(`⏱️ LIST: Import operation took ${totalImportTime.toFixed(2)}ms (${(totalImportTime / 1000).toFixed(3)}s)`);
    console.log(`📊 LIST: Average import time per record: ${(totalImportTime / Math.max(importedData.length, 1)).toFixed(2)}ms (${((totalImportTime / Math.max(importedData.length, 1)) / 1000).toFixed(6)}s)`);

    const changeDetectionStartTime = performance.now();
    this.cdRef.detectChanges();
    const changeDetectionEndTime = performance.now();
    console.log(`⏱️ LIST: Post-import change detection took ${(changeDetectionEndTime - changeDetectionStartTime).toFixed(2)}ms (${((changeDetectionEndTime - changeDetectionStartTime) / 1000).toFixed(6)}s)`);
  }

  // Missing methods that template expects
  getChangedConfiguration(index: number, data: any) {
    // Update the form control at the given index
    if (this.listItems.controls[index]) {
      this.listItems.controls[index].patchValue(data);

      // Emit changes to notify parent component (for save button)
      const currentValue = this.listItems.value;
      this.emitChanges(currentValue);
    }
  }

  formStatus(formState: any, index: number) {
    // Handle form status changes
    if (this.items[index]) {
      this.items[index].status = formState.status;
    }
    this.validConfigurationForm = !this.items.find(item => item.status === false);
    this.formStatusEvent.emit({
      status: this.listItems.valid && this.validConfigurationForm,
      group: this.group
    });
  }

  scrollToRow(index: number) {
    // Simple scroll to row implementation
    console.log(`Scroll to row ${index}`);
  }

  // Properties for debugging
  get isLoadingMore() {
    return false; // Simplified - no virtual scrolling for now
  }

  get hasMoreItems() {
    return false; // Simplified - no virtual scrolling for now
  }
}