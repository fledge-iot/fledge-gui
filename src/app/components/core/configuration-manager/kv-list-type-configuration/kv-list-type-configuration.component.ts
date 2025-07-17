import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ChangeDetectionStrategy, NgZone } from '@angular/core';
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
  styleUrls: ['./kv-list-type-configuration.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
  isListView = true;

  // Cached controls array for virtual scrolling performance
  private _cachedKvControls: AbstractControl[] = [];
  private _lastKvControlsLength = 0;

  private destroy$ = new Subject<void>();
  public processingChunk = false; // Changed from private to public for template access

  // Performance optimization properties - MUCH MORE AGGRESSIVE thresholds
  isLoadingLargeDataset = false;
  isViewSwitching = false; // Smart view switching indicator
  isLoadingInitialData = false; // For visual loading feedback without disabling buttons
  private LARGE_DATASET_THRESHOLD = 100; // Reduced from 2000 - now kicks in at 100+ items
  private FORM_CREATION_THRESHOLD = 200; // Reduced from 3000 - chunking starts at 200+ items
  private DOM_OPERATION_THRESHOLD = 500; // Reduced from 5000 - DOM optimization at 500+ items
  private PERFORMANCE_MODE_THRESHOLD = 100; // Reduced from 2000 - performance mode at 100+ items
  private VIEW_SWITCHING_THRESHOLD = 300; // Reduced from 3000 - loading indicator at 300+ items
  private DELETION_OPTIMIZATION_THRESHOLD = 400; // Reduced from 8000 - optimized deletion at 400+ items
  private isLargeDataset = false; // Track if we have large dataset for optimizations

  // New properties to handle deferred loading and file import distinction
  private isFileImportOperation = false; // Track if we're in a file import operation
  private initialLoadDeferred = false; // Track if initial load should be deferred
  private hasInitiallyLoaded = false; // Track if we've completed initial load

  constructor(
    public cdRef: ChangeDetectorRef,
    private zone: NgZone,
    public rolesService: RolesService,
    public configControlService: ConfigurationControlService,
    private fb: FormBuilder) {
    this.kvListItemsForm = this.fb.group({
      kvListItems: this.fb.array([])
    });
  }

  ngOnInit() {
    // Check if we should defer initial loading (for quickview scenarios)
    this.checkDeferredLoading();

    if (this.initialLoadDeferred) {
      console.log(`KvList: Using deferred loading for "${this.from}" context`);
      // Defer loading until after view is rendered
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.loadDataWithChunking();
            this.setupValueChangeSubscription();
          });
        }, 100); // Small delay to allow UI to render first
      });
    } else {
      console.log(`KvList: Using immediate loading`);
      this.loadDataWithChunking();
      this.setupValueChangeSubscription();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkDeferredLoading() {
    // Defer loading for quickview scenarios or when from contains 'modal'
    // to improve initial rendering performance
    this.initialLoadDeferred = this.from?.includes('quickview') ||
      this.from?.includes('modal') ||
      this.from?.includes('wizard');
  }

  private loadDataWithChunking() {
    let values = this.configuration?.value ? this.configuration.value : this.configuration.default;
    const t0 = performance.now();
    console.log(`KvList: Starting data loading for configuration "${this.configuration.key}"`);

    try {
      values = JSON.parse(values);
    } catch (e) {
      console.error('Error parsing kvlist values:', e);
      values = {};
    }

    const entries = Object.entries(values);
    console.log(`KvList: Found ${entries.length} entries to process`);

    if (entries.length === 0) {
      const t1 = performance.now();
      console.log(`KvList form creation took ${t1 - t0} ms for ${entries.length} items (empty dataset)`);
      this.hasInitiallyLoaded = true;
      this.cdRef.detectChanges();
      return;
    }

    // Track if this is a large dataset for performance optimizations
    this.isLargeDataset = entries.length > this.PERFORMANCE_MODE_THRESHOLD;

    // For initial data loading: show visual loading feedback but don't disable buttons
    // For file import: emit loading state that disables buttons
    if (entries.length > 200) { // Reduced from 1000 to 200
      if (this.isFileImportOperation) {
        // File import - disable buttons
        this.isLoadingLargeDataset = true;
        this.formStatusEvent.emit({ 'status': false, 'group': this.group, 'loading': true });
      } else {
        // Initial data loading - visual feedback only, don't disable buttons
        this.isLoadingInitialData = true;
      }
      this.cdRef.detectChanges();
    }

    // Use chunked processing for datasets over 200 items (reduced from 1000)
    if (entries.length > 200) {
      console.log(`KvList: Using chunked processing for ${entries.length} entries`);
      this.processEntriesChunked(entries, t0);
    } else {
      // Process normally for smaller datasets (faster)
      console.log(`KvList: Using normal processing for ${entries.length} entries`);
      for (const [key, value] of entries) {
        this.kvListItems.push(this.initListItem(false, { key, value }));
      }
      this.hasInitiallyLoaded = true;
      this.cdRef.detectChanges();

      const t1 = performance.now();
      console.log(`KvList form creation took ${t1 - t0} ms for ${entries.length} items (normal processing)`);

      if (this.isLoadingLargeDataset) {
        this.isLoadingLargeDataset = false;
        this.formStatusEvent.emit({ 'status': this.kvListItems.valid, 'group': this.group, 'loading': false });
        this.cdRef.detectChanges();
      }
    }
  }

  private processEntriesChunked(entries: [string, any][], startTime: number) {
    // Detach change detection for bulk operations
    this.cdRef.detach();
    this.processingChunk = true;

    // Optimized chunking based on dataset size
    let chunkSize, delay;
    if (entries.length > 10000) {
      // 10k+ items: large chunks with moderate delays
      chunkSize = 500;
      delay = 50;
    } else if (entries.length > 5000) {
      // 5k-10k items: medium chunks with small delays  
      chunkSize = 200;
      delay = 25;
    } else {
      // 1k-5k items: smaller chunks with minimal delays
      chunkSize = 100;
      delay = 10;
    }

    let currentIndex = 0;

    const processChunk = () => {
      const endIndex = Math.min(currentIndex + chunkSize, entries.length);

      // Use zone outside to prevent multiple change detection cycles
      this.zone.runOutsideAngular(() => {
        for (let i = currentIndex; i < endIndex; i++) {
          this.zone.run(() => {
            const [key, value] = entries[i];
            this.kvListItems.push(this.initListItem(false, { key, value }));
          });
        }
      });

      currentIndex = endIndex;

      if (currentIndex < entries.length) {
        // Use optimized scheduling for form creation
        this.zone.runOutsideAngular(() => {
          if ('requestIdleCallback' in window && entries.length > 5000) {
            // Use browser idle time for large datasets
            requestIdleCallback(() => {
              this.zone.run(() => processChunk());
            }, { timeout: delay + 50 });
          } else {
            setTimeout(() => {
              this.zone.run(() => processChunk());
            }, delay);
          }
        });
      } else {
        // Processing complete
        this.processingChunk = false;
        this.isLoadingLargeDataset = false;
        this.isLoadingInitialData = false;
        this.hasInitiallyLoaded = true;
        this.cdRef.reattach();
        this.cdRef.detectChanges();

        const t1 = performance.now();
        console.log(`KvList form creation took ${t1 - startTime} ms for ${entries.length} items (chunked processing)`);

        // Only emit loading complete for file import operations
        if (this.isFileImportOperation) {
          this.formStatusEvent.emit({ 'status': this.kvListItems.valid, 'group': this.group, 'loading': false });
        }
      }
    };

    // Start processing with a small initial delay to let UI settle
    setTimeout(() => processChunk(), 10);
  }

  private setupValueChangeSubscription() {
    this.kvListItems.valueChanges
      .pipe(
        debounceTime(this.isLargeDataset ? 500 : 300), // Longer debounce for large datasets
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        if (this.processingChunk) {
          return; // Skip processing during chunk loading
        }

        this.processValueChanges(data);
      });
  }

  private processValueChanges(data: any[]) {
    // Filter and process data
    const filteredData = filter(data, (d: any) => d.key && d.key.trim() !== '');
    const transformedObject = {};

    filteredData.forEach((item, index) => {
      // Handle float conversion
      if (this.configuration?.items === 'float') {
        if (+item.value && Number.isInteger(+item.value)) {
          item.value = Number.parseFloat(item.value).toFixed(1);
        } else if (item.value && item.value.toString().trim() === '') {
          item.value = Number.parseFloat('0').toFixed(1);
        }
      }

      let itemValue = item.value;

      // Handle object configuration
      if (this.configuration.items === 'object' && this.initialProperties[index]) {
        const property = this.initialProperties[index];
        for (const [key, prop] of Object.entries(property)) {
          (prop as any).value = itemValue[key];
        }
      }

      transformedObject[item.key] = itemValue;
    });

    this.changedConfig.emit({ [this.configuration.key]: JSON.stringify(transformedObject) });
    this.formStatusEvent.emit({ status: this.kvListItems.valid, group: this.group });
  }

  get kvListItems() {
    return this.kvListItemsForm.get('kvListItems') as FormArray;
  }

  get kvListItemControls(): AbstractControl[] {
    // Cache controls array for virtual scrolling performance
    const currentLength = this.kvListItems.length;
    if (currentLength !== this._lastKvControlsLength || this._cachedKvControls.length === 0) {
      this._cachedKvControls = [...this.kvListItems.controls];
      this._lastKvControlsLength = currentLength;
    }
    return this._cachedKvControls;
  }

  trackByIndex(index: number, _item: any): number {
    return index;
  }

  private refreshKvControlsCache() {
    // Force refresh of cached controls
    this._cachedKvControls = [...this.kvListItems.controls];
    this._lastKvControlsLength = this.kvListItems.length;
  }

  // Optimized trackBy for large datasets
  trackByFormControl(index: number, item: any): any {
    return this.isLargeDataset ? index : item;
  }

  // Optimize DOM operations for large datasets
  private optimizedDOMOperation(operation: () => void) {
    if (this.isLargeDataset) {
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(operation);
        }, 0);
      });
    } else {
      operation();
    }
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

    // Only optimize for very large datasets
    if (this.isLargeDataset && this.kvListItems.length > 3000) {
      this.cdRef.detach();
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
      if (this.isListView) {
        this.scrollToRow(index);
      } else {
        // Expand newly added item
        this.expandListItem(index);
      }
    }

    // Reattach change detection for very large datasets
    if (this.isLargeDataset && this.kvListItems.length > 3000) {
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.cdRef.reattach();
            this.cdRef.detectChanges();
          });
        }, 0);
      });
    } else {
      this.cdRef.detectChanges();
    }

    // Refresh cached controls after adding item
    this.refreshKvControlsCache();
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
    // More aggressive optimization for very large datasets (10k+)
    // Use lower threshold for deletion operations as they are more expensive
    const needsOptimization = this.kvListItems.length > this.DELETION_OPTIMIZATION_THRESHOLD;

    if (needsOptimization) {
      // For very large datasets, completely detach and use zone outside
      this.cdRef.detach();

      this.zone.runOutsideAngular(() => {
        // Perform deletion operations outside Angular zone
        this.kvListItems.removeAt(index);
        this.initialProperties.splice(index, 1);
        this.items.splice(index, 1);

        this.zone.run(() => {
          this.setChildConfigFormValidity();

          // Refresh cached controls after removing item
          this.refreshKvControlsCache();

          // Use longer delay for very large datasets to prevent UI blocking
          setTimeout(() => {
            this.cdRef.reattach();
            this.cdRef.detectChanges();
          }, this.kvListItems.length > 15000 ? 200 : 100);
        });
      });
    } else if (this.isLargeDataset && this.kvListItems.length > 5000) {
      // Medium optimization for moderately large datasets
      this.cdRef.detach();

      this.kvListItems.removeAt(index);
      this.initialProperties.splice(index, 1);
      this.items.splice(index, 1);
      this.setChildConfigFormValidity();

      // Refresh cached controls after removing item
      this.refreshKvControlsCache();

      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.cdRef.reattach();
            this.cdRef.detectChanges();
          });
        }, 50);
      });
    } else {
      // Normal processing for smaller datasets
      this.kvListItems.removeAt(index);
      this.initialProperties.splice(index, 1);
      this.items.splice(index, 1);
      this.setChildConfigFormValidity();

      // Refresh cached controls after removing item
      this.refreshKvControlsCache();

      this.cdRef.detectChanges();
    }
  }

  getChangedConfiguration(index: string, propertyChangedValues: any) {
    this.kvListItems.controls[index].controls['value'].patchValue(propertyChangedValues);
  }

  formStatus(formState: any, index) {
    // Only optimize form status updates for very large datasets
    if (this.isLargeDataset && this.kvListItems.length > 3000) {
      this.zone.runOutsideAngular(() => {
        this.items[index].status = formState.status;
        this.zone.run(() => {
          this.setChildConfigFormValidity();
          this.formStatusEvent.emit(formState);
        });
      });
    } else {
      this.items[index].status = formState.status;
      this.setChildConfigFormValidity();
      this.formStatusEvent.emit(formState);
    }
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
    // Add safety checks for DOM manipulation with timeout for heavy operations
    this.optimizedDOMOperation(() => {
      const cardHeader = document.getElementById('card-header-' + this.configuration.key + '-' + i + '-' + this.from);
      const cardBody = document.getElementById('card-content-' + this.configuration.key + '-' + i + '-' + this.from);

      if (!cardHeader || !cardBody) {
        return; // Silently skip if elements don't exist
      }

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
    });
  }

  expandAllItems() {
    // Use chunked processing only for very large datasets (DOM operations are fast)
    if (this.kvListItems.length > this.DOM_OPERATION_THRESHOLD) {
      this.expandAllItemsChunked();
    } else {
      for (let i = 0; i < this.kvListItems.length; i++) {
        this.expandCollapseSingleItem(i, true);
      }
    }
  }

  collapseAllItems() {
    // Use chunked processing only for very large datasets (DOM operations are fast)
    if (this.kvListItems.length > this.DOM_OPERATION_THRESHOLD) {
      this.collapseAllItemsChunked();
    } else {
      for (let i = 0; i < this.kvListItems.length; i++) {
        this.expandCollapseSingleItem(i, false);
      }
    }
  }

  private expandAllItemsChunked() {
    const chunkSize = 100; // Larger chunks for DOM operations (much faster than form creation)
    let currentIndex = 0;

    const processChunk = () => {
      const endIndex = Math.min(currentIndex + chunkSize, this.kvListItems.length);

      for (let i = currentIndex; i < endIndex; i++) {
        this.expandCollapseSingleItem(i, true);
      }

      currentIndex = endIndex;

      if (currentIndex < this.kvListItems.length) {
        this.zone.runOutsideAngular(() => {
          setTimeout(() => {
            this.zone.run(() => processChunk());
          }, 5); // Much shorter delay for DOM operations
        });
      }
    };

    processChunk();
  }

  private collapseAllItemsChunked() {
    const chunkSize = 100; // Larger chunks for DOM operations (much faster than form creation)
    let currentIndex = 0;

    const processChunk = () => {
      const endIndex = Math.min(currentIndex + chunkSize, this.kvListItems.length);

      for (let i = currentIndex; i < endIndex; i++) {
        this.expandCollapseSingleItem(i, false);
      }

      currentIndex = endIndex;

      if (currentIndex < this.kvListItems.length) {
        this.zone.runOutsideAngular(() => {
          setTimeout(() => {
            this.zone.run(() => processChunk());
          }, 5); // Much shorter delay for DOM operations
        });
      }
    };

    processChunk();
  }

  appendFileData(event) {
    // Mark this as a file import operation
    this.isFileImportOperation = true;

    // Show loading indicator for large file imports
    if (event.fileData && Object.keys(event.fileData).length > 1000) {
      this.isLoadingLargeDataset = true;
      this.formStatusEvent.emit({ 'status': false, 'group': this.group, 'loading': true });
      this.cdRef.detectChanges();

      // Process large file data in chunks
      this.processLargeFileData(event.fileData, false);
    } else {
      // Process normally for smaller files - this fixes the preview issue
      for (const [key, value] of Object.entries(event.fileData)) {
        this.kvListItems.push(this.initListItem(false, { key, value }));
      }
      this.cdRef.detectChanges();
      // Reset file import flag
      this.isFileImportOperation = false;
    }
  }

  overrideFileData(event) {
    // Mark this as a file import operation
    this.isFileImportOperation = true;

    // Show loading indicator for large file imports
    if (event.fileData && Object.keys(event.fileData).length > 1000) {
      this.isLoadingLargeDataset = true;
      this.kvListItems.clear();
      this.initialProperties = [];
      this.formStatusEvent.emit({ 'status': false, 'group': this.group, 'loading': true });
      this.cdRef.detectChanges();

      // Process large file data in chunks
      this.processLargeFileData(event.fileData, true);
    } else {
      // Process normally for smaller files - this fixes the preview issue
      this.kvListItems.clear();
      this.initialProperties = [];
      for (const [key, value] of Object.entries(event.fileData)) {
        this.kvListItems.push(this.initListItem(false, { key, value }));
      }
      this.cdRef.detectChanges();
      // Reset file import flag
      this.isFileImportOperation = false;
    }
  }

  private processLargeFileData(fileData: any, isOverride: boolean) {
    this.cdRef.detach();
    this.processingChunk = true;

    const entries = Object.entries(fileData);

    // Use optimized chunking for file imports - same as initial loading
    let chunkSize, delay;
    if (entries.length > 10000) {
      // 10k+ files: large chunks with moderate delays
      chunkSize = 500;
      delay = 50;
    } else if (entries.length > 5000) {
      // 5k-10k files: medium chunks with small delays  
      chunkSize = 200;
      delay = 25;
    } else {
      // 1k-5k files: smaller chunks with minimal delays
      chunkSize = 100;
      delay = 10;
    }

    let currentIndex = 0;

    const processChunk = () => {
      const endIndex = Math.min(currentIndex + chunkSize, entries.length);

      // Use zone outside to prevent multiple change detection cycles
      this.zone.runOutsideAngular(() => {
        for (let i = currentIndex; i < endIndex; i++) {
          this.zone.run(() => {
            const [key, value] = entries[i];
            this.kvListItems.push(this.initListItem(false, { key, value }));
          });
        }
      });

      currentIndex = endIndex;

      if (currentIndex < entries.length) {
        this.zone.runOutsideAngular(() => {
          if ('requestIdleCallback' in window && entries.length > 5000) {
            // Use browser idle time for large files
            requestIdleCallback(() => {
              this.zone.run(() => processChunk());
            }, { timeout: delay + 50 });
          } else {
            setTimeout(() => {
              this.zone.run(() => processChunk());
            }, delay);
          }
        });
      } else {
        // Processing complete
        this.processingChunk = false;
        this.isLoadingLargeDataset = false;
        this.cdRef.reattach();
        this.cdRef.detectChanges();

        // Emit loading complete
        this.formStatusEvent.emit({ 'status': this.kvListItems.valid, 'group': this.group, 'loading': false });
        // Reset file import flag
        this.isFileImportOperation = false;
      }
    };

    // Start processing with a small initial delay
    setTimeout(() => processChunk(), 10);
  }

  openModal() {
    this.hideDropDown();
    this.fileImportModal.toggleModal(true);
  }

  openExportFileModal() {
    this.hideDropDown();

    // Check if we have a large dataset that needs async processing
    const dataSize = this.kvListItems.length;

    if (dataSize > 1000) {
      // Process large datasets asynchronously to prevent blocking
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.prepareKvListData();
            this.fileExportModal.toggleModal(true);
          });
        }, 10); // Small delay to let UI update
      });
    } else {
      // Process small datasets immediately
      this.prepareKvListData();
      this.fileExportModal.toggleModal(true);
    }
  }

  private prepareKvListData() {
    this.kvlistValues = {};
    for (let [ind, val] of this.kvListItems.value.entries()) {
      this.kvlistValues[val.key] = val.value;
    }
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
    // Smart view switching - only show loading for very large datasets
    const needsViewSwitchingIndicator = this.kvListItems.length > this.VIEW_SWITCHING_THRESHOLD;

    if (needsViewSwitchingIndicator) {
      this.isViewSwitching = true;
      this.formStatusEvent.emit({ 'status': false, 'group': this.group, 'loading': true });
      this.cdRef.detectChanges();

      // Simplified and faster view switching
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.isListView = event.isListView;

            // Expand first item if switching to detailed view with exactly one item
            if (!this.isListView && this.kvListItems.length === 1) {
              setTimeout(() => {
                this.expandListItem(0);
              }, 10);
            }

            this.isViewSwitching = false;
            this.formStatusEvent.emit({ 'status': this.kvListItems.valid, 'group': this.group, 'loading': false });
            this.cdRef.detectChanges();
          });
        }, 50); // Reduced delay for faster switching
      });
    } else {
      // Instant switching for smaller datasets
      this.isListView = event.isListView;

      // Only expand first item if switching to detailed view and there's exactly one item
      if (!this.isListView && this.kvListItems.length === 1) {
        setTimeout(() => {
          this.expandListItem(0);
        }, 10);
      }

      this.cdRef.detectChanges();
    }
  }
}
