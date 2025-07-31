import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnInit, OnDestroy, Output, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { filter, uniqWith, isEqual, cloneDeep } from 'lodash';
import { CustomValidator } from '../../../../directives/custom-validator';
import { ConfigurationControlService, RolesService } from '../../../../services';
import { FileImportModalComponent } from '../../../common/file-import-modal/file-import-modal.component';
import { FileExportModalComponent } from '../../../common/file-export-modal/file-export-modal.component';
import { debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Subject } from 'rxjs';
import {
  PerformanceOptimizationService,
  PerformanceState,
  PerformanceThresholds,
  ChunkedDataProcessorService,
  ChunkProcessingCallbacks,
  DomOperationsService,
  FormManagementService,
  FormManagementCallbacks
} from './../list-kvlist/index';

@Component({
  selector: 'app-list-type-configuration',
  templateUrl: './list-type-configuration.component.html',
  styleUrls: ['./list-type-configuration.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListTypeConfigurationComponent implements OnInit, OnDestroy {
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

  // Cached controls array for virtual scrolling performance
  private _cachedControls: AbstractControl[] = [];
  private _lastControlsLength = 0;

  @ViewChild(CdkVirtualScrollViewport, { static: false }) viewport: CdkVirtualScrollViewport;

  private destroy$ = new Subject<void>();

  // Using shared services for performance optimization
  performanceState: PerformanceState;
  readonly thresholds: PerformanceThresholds;

  // Expose performance state properties for template access (preserving original public interface)
  get processingChunk(): boolean { return this.performanceState.processingChunk; }
  get isLoadingLargeDataset(): boolean { return this.performanceState.isLoadingLargeDataset; }
  get isViewSwitching(): boolean { return this.performanceState.isViewSwitching; }
  get isLoadingInitialData(): boolean { return this.performanceState.isLoadingInitialData; }
  get isExportingData(): boolean { return this.performanceState.isExportingData; }
  get isLargeDataset(): boolean { return this.performanceState.isLargeDataset; }
  get componentInitialized(): boolean { return this.performanceState.componentInitialized; }
  get hasInitiallyLoaded(): boolean { return this.performanceState.hasInitiallyLoaded; }
  get isFileImportOperation(): boolean { return this.performanceState.isFileImportOperation; }
  get initialLoadDeferred(): boolean { return this.performanceState.initialLoadDeferred; }
  get scrollDebounceTimer(): any { return this.performanceState.scrollDebounceTimer; }

  // Properties that need setters for backward compatibility
  set componentInitialized(value: boolean) { this.performanceState.componentInitialized = value; }
  set hasInitiallyLoaded(value: boolean) { this.performanceState.hasInitiallyLoaded = value; }
  set isFileImportOperation(value: boolean) { this.performanceState.isFileImportOperation = value; }
  set initialLoadDeferred(value: boolean) { this.performanceState.initialLoadDeferred = value; }
  set scrollDebounceTimer(value: any) { this.performanceState.scrollDebounceTimer = value; }
  set isLargeDataset(value: boolean) { this.performanceState.isLargeDataset = value; }
  set processingChunk(value: boolean) { this.performanceState.processingChunk = value; }
  set isLoadingLargeDataset(value: boolean) { this.performanceState.isLoadingLargeDataset = value; }
  set isLoadingInitialData(value: boolean) { this.performanceState.isLoadingInitialData = value; }
  set isExportingData(value: boolean) { this.performanceState.isExportingData = value; }
  set isViewSwitching(value: boolean) { this.performanceState.isViewSwitching = value; }

  // Legacy threshold properties for backward compatibility
  get PERFORMANCE_MODE_THRESHOLD(): number { return this.thresholds.PERFORMANCE_MODE_THRESHOLD; }
  get VIEW_SWITCHING_THRESHOLD(): number { return this.thresholds.VIEW_SWITCHING_THRESHOLD; }
  get DELETION_OPTIMIZATION_THRESHOLD(): number { return this.thresholds.DELETION_OPTIMIZATION_THRESHOLD; }
  get VIRTUAL_SCROLL_THRESHOLD(): number { return this.thresholds.VIRTUAL_SCROLL_THRESHOLD; }
  get DOM_OPERATION_THRESHOLD(): number { return this.thresholds.DOM_OPERATION_THRESHOLD; }

  // Additional performance state properties
  get isVirtualScrollOptimized(): boolean { return this.performanceState.isVirtualScrollOptimized; }
  get visibleItemsBuffer(): number { return this.performanceState.visibleItemsBuffer; }
  get lastScrollTop(): number { return this.performanceState.lastScrollTop; }

  set isVirtualScrollOptimized(value: boolean) { this.performanceState.isVirtualScrollOptimized = value; }
  set visibleItemsBuffer(value: number) { this.performanceState.visibleItemsBuffer = value; }
  set lastScrollTop(value: number) { this.performanceState.lastScrollTop = value; }

  constructor(
    private zone: NgZone,
    public cdRef: ChangeDetectorRef,
    public rolesService: RolesService,
    public configControlService: ConfigurationControlService,
    private fb: FormBuilder,
    private performanceService: PerformanceOptimizationService,
    private chunkedProcessor: ChunkedDataProcessorService,
    private domOperations: DomOperationsService,
    private formManagement: FormManagementService) {

    this.listItemsForm = this.fb.group({
      listItems: this.fb.array([])
    });

    // Initialize performance state and thresholds
    this.performanceState = this.performanceService.createPerformanceState();
    this.thresholds = this.performanceService.DEFAULT_THRESHOLDS;
  }

  ngOnInit() {
    // Only load data if this is the first initialization
    if (!this.componentInitialized) {
      console.log(`📋 LIST COMPONENT INIT: Group="${this.group}", Category="${this.categoryName}", Config="${this.configuration.key}"`);

      if (this.configuration.items == 'object') {
        this.firstKey = Object.keys(this.configuration.properties)[0];
        // Show first property label as list card header
        this.listLabel = this.configuration.properties[this.firstKey]?.displayName ?? this.firstKey;
      }

      // Since we're now using true lazy loading with *ngIf, always load data immediately
      // Components are only created when tab is selected
      console.log(`List: Loading data immediately for tab "${this.group}"`);
      this.loadDataWithChunking();
      this.setupValueChangeSubscription();

      // Mark as initialized so subsequent ngOnInit calls (when shown again) won't reload data
      this.componentInitialized = true;
    } else {
      console.log(`📋 LIST COMPONENT SHOWN: Group="${this.group}", Preserving existing state with ${this.listItems.length} items`);
      // Component is being shown again, just trigger change detection to refresh UI
      this.cdRef.detectChanges();
    }
  }

  ngOnDestroy() {
    console.log(`📋 LIST COMPONENT DESTROYED: Group="${this.group}"`);
    this.destroy$.next();
    this.destroy$.complete();

    // Cleanup using shared performance service
    this.performanceService.cleanupScrollTimer(this.performanceState);
  }

  private checkDeferredLoading() {
    // No longer needed - components are now truly lazy loaded with *ngIf
    // This method is kept for compatibility but deferred loading is disabled
    this.initialLoadDeferred = false;
  }

  private loadDataWithChunking() {
    let values = this.configuration?.value ?? this.configuration.default;
    const t0 = performance.now();
    console.log(`List: Starting data loading for configuration "${this.configuration.key}"`);

    try {
      values = JSON.parse(values);
    } catch (e) {
      console.error('Error parsing list values:', e);
      values = [];
    }

    if (this.configuration.listName) {
      values = values[this.configuration.listName];
    }

    const itemCount = Array.isArray(values) ? values.length : 0;
    console.log(`List: Found ${itemCount} items to process`);

    if (!Array.isArray(values) || values.length === 0) {
      const t1 = performance.now();
      console.log(`List form creation took ${t1 - t0} ms for ${Array.isArray(values) ? values.length : 0} items (empty dataset)`);
      this.hasInitiallyLoaded = true;
      this.cdRef.detectChanges();
      return;
    }

    // Track if this is a large dataset for performance optimizations
    this.isLargeDataset = values.length > this.PERFORMANCE_MODE_THRESHOLD;

    // Show loading indicator using shared service
    if (this.chunkedProcessor.shouldShowLoadingIndicator(values.length)) {
      if (this.isFileImportOperation) {
        this.isLoadingLargeDataset = true;
        this.formStatusEvent.emit({ status: false, group: this.group, loading: true });
      } else {
        this.isLoadingInitialData = true;
        this.formStatusEvent.emit({ status: false, group: this.group, loading: true });
      }
      this.cdRef.detectChanges();

      // Defer data processing to ensure loading indicator renders first
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.processDataWithSharedService(values, t0);
          });
        }, 50);
      });
    } else {
      this.processDataWithSharedService(values, t0);
    }
  }

  private processDataWithSharedService(values: any[], startTime: number) {
    const callbacks: ChunkProcessingCallbacks<any> = {
      processItem: (item: any) => this.initListItem(false, item),
      onProcessingComplete: (totalCount: number, start: number) => {
        const t1 = performance.now();
        console.log(`List form creation took ${t1 - start} ms for ${totalCount} items`);
      },
      emitLoadingComplete: () => {
        this.formStatusEvent.emit({ status: this.listItems.valid, group: this.group, loading: false });
      },
      enablePostLoadOptimizations: (itemCount: number) => {
        this.performanceService.enablePostLoadOptimizations(
          itemCount,
          this.thresholds,
          {
            enableChangeDetectionThrottling: () => this.setupOptimizedValueChangeSubscription(),
            optimizeViewportHandling: () => this.optimizeViewport(),
            enableAggressiveMemoryManagement: () => this.cdRef.markForCheck(),
            setupScrollOptimization: () => this.setupScrollHandling()
          }
        );
      }
    };

    if (this.chunkedProcessor.shouldUseChunkedProcessing(values.length)) {
      console.log(`List: Using chunked processing for ${values.length} items`);
      this.chunkedProcessor.processDataChunked(
        values,
        startTime,
        this.performanceState,
        this.cdRef,
        callbacks,
        { logProgress: true, useRequestIdleCallback: true }
      );
    } else {
      console.log(`List: Using normal processing for ${values.length} items`);
      this.chunkedProcessor.processNormalData(
        values,
        startTime,
        this.performanceState,
        this.cdRef,
        callbacks
      );
    }
  }

  private optimizeViewport() {
    if (this.viewport && this.listItems.length > 5000) {
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.viewport.checkViewportSize();
            this.refreshControlsCache();
          });
        }, 100);
      });
    }
  }

  private setupScrollHandling() {
    if (this.viewport && this.listItems.length > this.VIRTUAL_SCROLL_THRESHOLD) {
      this.viewport.elementScrolled().pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.performanceService.handleOptimizedScroll(this.performanceState, this.cdRef);
      });
    }
  }

  private setupOptimizedValueChangeSubscription() {
    // More aggressive optimization for value change subscriptions
    this.listItems.valueChanges
      .pipe(
        debounceTime(this.isLargeDataset ? (this.listItems.length > 5000 ? 1200 : 800) : 300), // Even longer debounce for very large datasets
        distinctUntilChanged(isEqual),
        takeUntil(this.destroy$),
        map((value: any) => {
          if (this.processingChunk) {
            return null; // Skip processing during chunk loading
          }

          // Use zone outside for processing to reduce overhead
          return this.zone.runOutsideAngular(() => {
            // Remove empty, undefined, null values
            let filtered = filter(value);

            // Convert to float if needed
            if (this.configuration?.items === 'float') {
              filtered = filtered.map((num: any) => Number.isInteger(+num) ? Number.parseFloat(num).toFixed(1) : num);
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
          });
        })
      )
      .subscribe((processedValue) => {
        if (processedValue === null) {
          return; // Skip if processing during chunk loading
        }

        // For very large datasets, batch emissions with longer delays to prevent UI blocking
        if (this.isLargeDataset && this.listItems.length > 5000) {
          this.zone.runOutsideAngular(() => {
            setTimeout(() => {
              this.zone.run(() => {
                this.emitChanges(processedValue);
              });
            }, 50); // Longer delay for very large datasets
          });
        } else {
          this.emitChanges(processedValue);
        }
      });
  }

  private setupValueChangeSubscription() {
    // Regular subscription setup for smaller datasets
    if (this.isLargeDataset && this.listItems.length > 1000) {
      // Use optimized version for large datasets
      this.setupOptimizedValueChangeSubscription();
      return;
    }

    // Standard subscription for smaller datasets
    this.listItems.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(isEqual),
        takeUntil(this.destroy$),
        map((value: any) => {
          if (this.processingChunk) {
            return null; // Skip processing during chunk loading
          }

          // Remove empty, undefined, null values
          let filtered = filter(value);

          // Convert to float if needed
          if (this.configuration?.items === 'float') {
            filtered = filtered.map((num: any) => Number.isInteger(+num) ? Number.parseFloat(num).toFixed(1) : num);
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
        if (processedValue === null) {
          return; // Skip if processing during chunk loading
        }

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
  }

  get listItems() {
    return this.listItemsForm.get('listItems') as FormArray;
  }

  get listItemControls(): AbstractControl[] {
    // Cache controls array for virtual scrolling performance
    const currentLength = this.listItems.length;
    if (currentLength !== this._lastControlsLength || this._cachedControls.length === 0) {
      this._cachedControls = [...this.listItems.controls];
      this._lastControlsLength = currentLength;
    }
    return this._cachedControls;
  }

  private refreshControlsCache() {
    // Force refresh of cached controls
    this._cachedControls = [...this.listItems.controls];
    this._lastControlsLength = this.listItems.length;
  }

  trackByIndex(index: number, _item: AbstractControl): number {
    return index;
  }

  // Optimized trackBy for large datasets
  trackByFormControl(index: number, item: any): any {
    return this.isLargeDataset ? index : item;
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
    if (!this.formManagement.validateListSize(this.listItems, this.configuration)) {
      return;
    }

    // For very large datasets, use optimized operations from shared service
    if (this.performanceService.shouldNeedOptimization(this.listItems.length, 5000)) {
      const callbacks: FormManagementCallbacks = {
        refreshControlsCache: () => this.refreshControlsCache(),
        setChildConfigFormValidity: () => this.setChildConfigFormValidity(),
        formStatusEvent: (status) => this.formStatusEvent.emit(status)
      };

      this.formManagement.addListItemOptimized(
        this.listItems,
        () => this.createListItem(isPrepend),
        isPrepend,
        this.performanceState,
        this.cdRef,
        callbacks,
        this.group
      );
      return;
    }

    // Standard processing for smaller datasets
    this.initListItem(isPrepend);
    this.formStatusEvent.emit({ status: this.listItems.valid, group: this.group });

    this.formManagement.handleAddItemViewOperations(
      this.listItems,
      isPrepend,
      this.isListView,
      this.configuration,
      this.from,
      (index) => this.scrollToRow(index),
      (index) => this.expandListItem(index),
      this.performanceState,
      this.thresholds,
      this.cdRef,
      this.viewport
    );

    this.refreshControlsCache();
  }

  private createListItem(isPrepend: boolean) {
    this.initListItem(isPrepend);
    return this.listItems.at(isPrepend ? 0 : this.listItems.length - 1);
  }

  scrollToRow(i) {
    this.domOperations.scrollToRow(this.configuration.key, i, this.from);
  }

  removeListItem(index: number) {
    const callbacks: FormManagementCallbacks = {
      refreshControlsCache: () => this.refreshControlsCache(),
      setChildConfigFormValidity: () => this.setChildConfigFormValidity(),
      formStatusEvent: (status) => this.formStatusEvent.emit(status)
    };

    this.formManagement.removeListItemOptimized(
      this.listItems,
      index,
      this.initialProperties,
      this.items,
      this.performanceState,
      this.thresholds,
      this.cdRef,
      callbacks
    );

    // Handle viewport scrolling for normal datasets
    if (!this.performanceService.shouldNeedOptimization(this.listItems.length, this.thresholds.DELETION_OPTIMIZATION_THRESHOLD)) {
      this.domOperations.handleViewportScrolling(this.viewport, this.listItems.length);
    }
  }

  getChangedConfiguration(index, propertyChangedValues: any) {
    this.listItems.controls[index].patchValue(propertyChangedValues);
  }

  formStatus(formState: any, index) {
    const callbacks: FormManagementCallbacks = {
      refreshControlsCache: () => this.refreshControlsCache(),
      setChildConfigFormValidity: () => this.setChildConfigFormValidity(),
      formStatusEvent: (status) => this.formStatusEvent.emit(status)
    };

    this.formManagement.handleFormStatusUpdate(
      formState,
      index,
      this.items,
      this.performanceState,
      this.listItems,
      callbacks
    );
  }

  setChildConfigFormValidity() {
    this.validConfigurationForm = this.formManagement.setChildConfigFormValidity(this.items);
  }

  expandListItem(index) {
    setTimeout(() => {
      this.domOperations.expandCollapseSingleItem(
        this.configuration.key,
        index,
        true,
        this.from,
        true,
        this.isLargeDataset
      );
    }, 1);
  }

  expandCollapseSingleItem(i: number, isExpand: boolean, scrollIntoView = false) {
    this.domOperations.expandCollapseSingleItem(
      this.configuration.key,
      i,
      isExpand,
      this.from,
      scrollIntoView,
      this.isLargeDataset
    );
  }

  expandAllItems() {
    this.domOperations.expandAllItems(
      this.listItems.length,
      this.configuration.key,
      this.from,
      this.thresholds,
      this.isLargeDataset
    );
  }

  collapseAllItems() {
    this.domOperations.collapseAllItems(
      this.listItems.length,
      this.configuration.key,
      this.from,
      this.thresholds,
      this.isLargeDataset
    );
  }

  appendFileData(event) {
    const appendStartTime = performance.now();
    const dataLength = event.fileData ? event.fileData.length : 0;
    console.log(`🚀 LIST APPEND START: Adding ${dataLength} items to existing ${this.listItems.length} items, Category=${this.categoryName}, Config=${this.configuration.key}`);

    // Mark this as a file import operation
    this.isFileImportOperation = true;

    // Show loading indicator for large file imports
    if (event.fileData && event.fileData.length > 1000) {
      console.log(`⚡ Using chunked processing for large append operation`);
      this.isLoadingLargeDataset = true;
      this.formStatusEvent.emit({ status: false, group: this.group, loading: true });
      this.cdRef.detectChanges();

      // Process large file data in chunks
      this.processLargeFileData(event.fileData, false, appendStartTime);
    } else {
      console.log(`🏃 Using standard processing for small append operation`);
      // Process normally for smaller files - this fixes the preview issue
      const processingStartTime = performance.now();
      event.fileData.forEach(element => {
        this.initListItem(false, element);
      });
      const processingEndTime = performance.now();

      console.log(`✅ Standard append processing: ${processingEndTime - processingStartTime}ms for ${dataLength} items`);
      this.cdRef.detectChanges();
      // Reset file import flag
      this.isFileImportOperation = false;

      const appendEndTime = performance.now();
      console.log(`🎉 TOTAL LIST APPEND TIME: ${appendEndTime - appendStartTime}ms - Added ${dataLength} items (Total now: ${this.listItems.length})`);
    }
  }

  overrideFileData(event) {
    const overrideStartTime = performance.now();
    const dataLength = event.fileData ? event.fileData.length : 0;
    const existingItemCount = this.listItems.length;
    console.log(`🚀 LIST OVERRIDE START: Replacing ${existingItemCount} items with ${dataLength} new items, Category=${this.categoryName}, Config=${this.configuration.key}`);

    // Mark this as a file import operation
    this.isFileImportOperation = true;

    // Show loading indicator for large file imports
    if (event.fileData && event.fileData.length > 1000) {
      console.log(`⚡ Using chunked processing for large override operation`);
      this.isLoadingLargeDataset = true;
      this.listItems.clear();
      this.initialProperties = [];
      this.formStatusEvent.emit({ status: false, group: this.group, loading: true });
      this.cdRef.detectChanges();

      // Process large file data in chunks
      this.processLargeFileData(event.fileData, true, overrideStartTime);
    } else {
      console.log(`🏃 Using standard processing for small override operation`);
      // Process normally for smaller files - this fixes the preview issue
      const clearStartTime = performance.now();
      this.listItems.clear();
      this.initialProperties = [];
      const clearEndTime = performance.now();
      console.log(`🗑️ List cleared: ${clearEndTime - clearStartTime}ms`);

      const processingStartTime = performance.now();
      event.fileData.forEach(element => {
        this.initListItem(false, element);
      });
      const processingEndTime = performance.now();

      console.log(`✅ Standard override processing: ${processingEndTime - processingStartTime}ms for ${dataLength} items`);
      this.cdRef.detectChanges();
      // Reset file import flag
      this.isFileImportOperation = false;

      const overrideEndTime = performance.now();
      console.log(`🎉 TOTAL LIST OVERRIDE TIME: ${overrideEndTime - overrideStartTime}ms - Replaced ${existingItemCount} with ${dataLength} items`);
    }
  }

  private processLargeFileData(fileData: any[], isOverride: boolean, operationStartTime?: number) {
    const chunkingStartTime = performance.now();
    console.log(`🔄 LIST CHUNKED PROCESSING START: ${isOverride ? 'Override' : 'Append'} with ${fileData.length} items`);

    const callbacks: ChunkProcessingCallbacks<any> = {
      processItem: (item: any) => this.initListItem(false, item),
      onProcessingComplete: (totalCount: number, start: number) => {
        const chunkingEndTime = performance.now();
        console.log(`✅ LIST CHUNKED PROCESSING COMPLETE: ${chunkingEndTime - start}ms for ${totalCount} items`);

        if (operationStartTime) {
          const totalOperationTime = chunkingEndTime - operationStartTime;
          console.log(`🎉 TOTAL LIST ${isOverride ? 'OVERRIDE' : 'APPEND'} TIME: ${totalOperationTime}ms - Processed ${totalCount} items (Total now: ${this.listItems.length})`);
        }
      },
      emitLoadingComplete: () => {
        this.formStatusEvent.emit({ status: this.listItems.valid, group: this.group, loading: false });
        this.isFileImportOperation = false;
      },
      enablePostLoadOptimizations: (itemCount: number) => {
        // Post-load optimizations handled by shared service
      }
    };

    this.chunkedProcessor.processDataChunked(
      fileData,
      chunkingStartTime,
      this.performanceState,
      this.cdRef,
      callbacks,
      { logProgress: true, useRequestIdleCallback: true, progressLogInterval: 5000 }
    );
  }

  openModal() {
    this.hideDropDown();
    // Ensure modal state is reset when opening
    this.fileImportModal.toggleModal(true);
  }

  openExportFileModal() {
    const exportPrepStartTime = performance.now();
    const dataSize = this.listItems.length;
    console.log(`🚀 LIST EXPORT PREPARATION START: ${dataSize} items, Category=${this.categoryName}, Config=${this.configuration.key}`);

    // Show loading indicator during export preparation
    this.isExportingData = true;
    this.cdRef.detectChanges();

    this.hideDropDown();

    // Check if we have a large dataset that needs async processing
    if (dataSize > 1000) {
      console.log(`⚡ Using async preparation for large dataset`);
      // Process large datasets asynchronously to prevent blocking
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.prepareListData(exportPrepStartTime);
            this.isExportingData = false; // Hide loading indicator
            this.cdRef.detectChanges();
            this.fileExportModal.toggleModal(true);
          });
        }, 10); // Small delay to let UI update
      });
    } else {
      console.log(`🏃 Using sync preparation for small dataset`);
      // Process small datasets immediately but still show loading briefly
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.prepareListData(exportPrepStartTime);
            this.isExportingData = false; // Hide loading indicator
            this.cdRef.detectChanges();
            this.fileExportModal.toggleModal(true);
          });
        }, 50); // Brief delay to show loading indicator
      });
    }
  }

  private prepareListData(prepStartTime?: number) {
    const dataStartTime = performance.now();
    const originalLength = this.listItems.value.length;
    console.log(`🔄 LIST DATA PREPARATION START: Processing ${originalLength} items`);

    this.listValues = this.listItems.value;
    this.listValues = uniqWith(this.listValues, isEqual);

    const dataEndTime = performance.now();
    const duplicatesRemoved = originalLength - this.listValues.length;
    console.log(`✅ LIST DATA PREPARATION COMPLETE: ${dataEndTime - dataStartTime}ms, Removed ${duplicatesRemoved} duplicates, Final count: ${this.listValues.length}`);

    if (prepStartTime) {
      const totalPrepTime = dataEndTime - prepStartTime;
      console.log(`🎯 TOTAL LIST EXPORT PREPARATION TIME: ${totalPrepTime}ms for ${this.listValues.length} items`);
    }
  }

  toggleDropdown() {
    this.domOperations.toggleDropdown(this.configuration?.key);
  }

  hideDropDown() {
    this.domOperations.hideDropDown(this.configuration?.key);
  }

  setCurrentView(event) {
    // Smart view switching using shared performance service
    const needsViewSwitchingIndicator = this.performanceService.shouldNeedOptimization(
      this.listItems.length,
      this.thresholds.VIEW_SWITCHING_THRESHOLD
    );

    if (needsViewSwitchingIndicator) {
      this.isViewSwitching = true;
      this.formStatusEvent.emit({ status: false, group: this.group, loading: true });
      this.cdRef.detectChanges();

      // Use optimized view switching from performance service
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.isListView = event.isListView;

            // Expand first item if switching to detailed view with exactly one item
            if (!this.isListView && this.listItems.length === 1) {
              setTimeout(() => {
                this.expandListItem(0);
              }, 10);
            }

            this.isViewSwitching = false;
            this.formStatusEvent.emit({ status: this.listItems.valid, group: this.group, loading: false });
            this.cdRef.detectChanges();
          });
        }, 50);
      });
    } else {
      // Instant switching for smaller datasets
      this.isListView = event.isListView;

      // Only expand first item if switching to detailed view and there's exactly one item
      if (!this.isListView && this.listItems.length === 1) {
        setTimeout(() => {
          this.expandListItem(0);
        }, 10);
      }

      this.cdRef.detectChanges();
    }
  }
}