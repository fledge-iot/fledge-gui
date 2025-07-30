import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { filter, cloneDeep } from 'lodash';
import { CustomValidator } from '../../../../directives/custom-validator';
import { ConfigurationControlService, RolesService } from '../../../../services';
import { FileImportModalComponent } from '../../../common/file-import-modal/file-import-modal.component';
import { FileExportModalComponent } from '../../../common/file-export-modal/file-export-modal.component';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
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
} from '../list-type-configuration';

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
    public cdRef: ChangeDetectorRef,
    private zone: NgZone,
    public rolesService: RolesService,
    public configControlService: ConfigurationControlService,
    private fb: FormBuilder,
    private performanceService: PerformanceOptimizationService,
    private chunkedProcessor: ChunkedDataProcessorService,
    private domOperations: DomOperationsService,
    private formManagement: FormManagementService) {

    this.kvListItemsForm = this.fb.group({
      kvListItems: this.fb.array([])
    });

    // Initialize performance state and thresholds
    this.performanceState = this.performanceService.createPerformanceState();
    this.thresholds = this.performanceService.DEFAULT_THRESHOLDS;
  }

  ngOnInit() {
    // Only load data if this is the first initialization
    if (!this.componentInitialized) {
      console.log(`📋 KV-LIST COMPONENT INIT: Group="${this.group}", Category="${this.categoryName}", Config="${this.configuration.key}"`);

      // Since we're now using true lazy loading with *ngIf, always load data immediately
      // Components are only created when tab is selected
      console.log(`KvList: Loading data immediately for tab "${this.group}"`);
      this.loadDataWithChunking();
      this.setupValueChangeSubscription();

      // Mark as initialized so subsequent ngOnInit calls (when shown again) won't reload data
      this.componentInitialized = true;
    } else {
      console.log(`📋 KV-LIST COMPONENT SHOWN: Group="${this.group}", Preserving existing state with ${this.kvListItems.length} items`);
      // Component is being shown again, just trigger change detection to refresh UI
      this.cdRef.detectChanges();
    }
  }

  ngOnDestroy() {
    console.log(`📋 KV-LIST COMPONENT DESTROYED: Group="${this.group}"`);
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

    // Show loading indicator using shared service
    if (this.chunkedProcessor.shouldShowLoadingIndicator(entries.length)) {
      if (this.isFileImportOperation) {
        this.isLoadingLargeDataset = true;
        this.formStatusEvent.emit({ 'status': false, 'group': this.group, 'loading': true });
      } else {
        this.isLoadingInitialData = true;
        this.formStatusEvent.emit({ 'status': false, 'group': this.group, 'loading': true });
      }
      this.cdRef.detectChanges();

      // Defer data processing to ensure loading indicator renders first
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.processDataWithSharedService(entries, t0);
          });
        }, 50);
      });
    } else {
      this.processDataWithSharedService(entries, t0);
    }
  }

  private processDataWithSharedService(entries: [string, any][], startTime: number) {
    const callbacks: ChunkProcessingCallbacks<[string, any]> = {
      processItem: ([key, value]: [string, any]) => {
        this.kvListItems.push(this.initListItem(false, { key, value }));
      },
      onProcessingComplete: (totalCount: number, start: number) => {
        const t1 = performance.now();
        console.log(`KvList form creation took ${t1 - start} ms for ${totalCount} entries`);
      },
      emitLoadingComplete: () => {
        this.formStatusEvent.emit({ 'status': this.kvListItems.valid, 'group': this.group, 'loading': false });
      },
      enablePostLoadOptimizations: (itemCount: number) => {
        this.performanceService.enablePostLoadOptimizations(
          itemCount,
          this.thresholds,
          {
            enableChangeDetectionThrottling: () => this.setupOptimizedValueChangeSubscription(),
            optimizeViewportHandling: () => this.refreshKvControlsCache(),
            enableAggressiveMemoryManagement: () => this.cdRef.markForCheck(),
            setupScrollOptimization: () => { }
          }
        );
      }
    };

    if (this.chunkedProcessor.shouldUseChunkedProcessing(entries.length)) {
      console.log(`KvList: Using chunked processing for ${entries.length} entries`);
      this.chunkedProcessor.processDataChunked(
        entries,
        startTime,
        this.performanceState,
        this.cdRef,
        callbacks,
        { logProgress: true, useRequestIdleCallback: true }
      );
    } else {
      console.log(`KvList: Using normal processing for ${entries.length} entries`);
      this.chunkedProcessor.processNormalData(
        entries,
        startTime,
        this.performanceState,
        this.cdRef,
        callbacks
      );
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
        // Processing complete - Use progressive reattachment for large datasets
        this.processingChunk = false;
        this.isLoadingLargeDataset = false;
        this.isLoadingInitialData = false;
        this.hasInitiallyLoaded = true;

        // For very large datasets, use progressive reattachment to prevent freezing
        if (entries.length > 5000) {
          this.progressiveReattachment(entries.length, startTime);
        } else {
          this.cdRef.reattach();
          this.cdRef.detectChanges();

          const t1 = performance.now();
          console.log(`KvList form creation took ${t1 - startTime} ms for ${entries.length} items (chunked processing)`);

          // Emit loading complete for file import operations OR for 1k+ initial data loading
          if (this.isFileImportOperation || entries.length >= 1000) {
            this.formStatusEvent.emit({ 'status': this.kvListItems.valid, 'group': this.group, 'loading': false });
          }
        }
      }
    };

    // Start processing with a small initial delay to let UI settle
    setTimeout(() => processChunk(), 10);
  }

  private progressiveReattachment(itemCount: number, startTime: number) {
    // Progressive reattachment for very large datasets to prevent UI freezing
    this.zone.runOutsideAngular(() => {
      // Use requestAnimationFrame for smooth reattachment
      requestAnimationFrame(() => {
        this.zone.run(() => {
          this.cdRef.reattach();

          // Batch change detection for large datasets
          setTimeout(() => {
            this.cdRef.detectChanges();

            const t1 = performance.now();
            console.log(`KvList form creation took ${t1 - startTime} ms for ${itemCount} items (chunked processing with progressive reattachment)`);

            // Emit loading complete
            if (this.isFileImportOperation || itemCount >= 1000) {
              this.formStatusEvent.emit({ 'status': this.kvListItems.valid, 'group': this.group, 'loading': false });
            }

            // Enable optimizations for large datasets post-load
            this.enablePostLoadOptimizations(itemCount);
          }, 16); // ~60fps frame timing
        });
      });
    });
  }

  private enablePostLoadOptimizations(itemCount: number) {
    if (itemCount > 5000) {
      console.log(`KvList: Enabling post-load optimizations for ${itemCount} items`);

      // Enable efficient change detection throttling
      this.enableChangeDetectionThrottling();

      // Optimize viewport handling for very large datasets
      this.optimizeViewportHandling();

      // Enable aggressive memory management for very large datasets
      this.enableAggressiveMemoryManagement();

      // Setup scroll optimization
      this.setupScrollOptimization();
    }
  }

  private enableChangeDetectionThrottling() {
    // Implement change detection throttling for large datasets
    if (this.isLargeDataset && this.kvListItems.length > 5000) {
      // Temporarily detach change detection during heavy operations
      this.zone.runOutsideAngular(() => {
        // Use longer debounce times for value changes
        this.destroy$.next();
        this.setupOptimizedValueChangeSubscription();
      });
    }
  }

  private optimizeViewportHandling() {
    // Optimize virtual scroll viewport for large datasets
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => {
          // Refresh cached controls for virtual scrolling
          this.refreshKvControlsCache();

          // Enable virtual scroll optimizations
          if (this.kvListItems.length > this.VIRTUAL_SCROLL_THRESHOLD) {
            this.enableVirtualScrollOptimizations();
          }
        });
      }, 100);
    });
  }

  private enableAggressiveMemoryManagement() {
    console.log(`KvList: Enabling aggressive memory management for ${this.kvListItems.length} items`);

    // Implement memory-efficient form control management
    this.zone.runOutsideAngular(() => {
      // Detach change detection for optimization setup
      this.cdRef.detach();

      // Setup memory management for very large datasets
      this.setupMemoryEfficientControls();

      // Reattach with optimized settings
      setTimeout(() => {
        this.zone.run(() => {
          this.cdRef.reattach();
          this.cdRef.detectChanges();
        });
      }, 100);
    });
  }

  private enableVirtualScrollOptimizations() {
    if (!this.isVirtualScrollOptimized) {
      console.log(`KvList: Enabling virtual scroll optimizations`);
      this.isVirtualScrollOptimized = true;

      // Setup scroll-based optimizations
      this.setupScrollOptimization();
    }
  }

  private setupMemoryEfficientControls() {
    // Implement lazy form control creation for very large datasets
    if (this.kvListItems.length > this.VIRTUAL_SCROLL_THRESHOLD) {
      console.log(`KvList: Setting up memory-efficient controls for ${this.kvListItems.length} items`);

      // Use OnPush change detection more aggressively
      this.cdRef.markForCheck();

      // Reduce form control complexity for non-visible items
      this.optimizeFormControlsForMemory();
    }
  }

  private optimizeFormControlsForMemory() {
    // Detach value change subscriptions for very large datasets temporarily
    this.zone.runOutsideAngular(() => {
      // Temporarily pause subscriptions during optimization
      this.destroy$.next();

      // Setup optimized subscriptions
      setTimeout(() => {
        this.zone.run(() => {
          this.setupOptimizedValueChangeSubscription();
        });
      }, 200);
    });
  }

  private setupScrollOptimization() {
    // Setup scroll-based optimizations for very large datasets
    this.zone.runOutsideAngular(() => {
      // Handle scroll optimizations outside Angular zone
      this.handleScrollOptimization();
    });
  }

  private handleScrollOptimization() {
    // Optimize scroll handling for large datasets
    // Debounce scroll-based optimizations for performance
    if (this.scrollDebounceTimer) {
      clearTimeout(this.scrollDebounceTimer);
    }

    this.scrollDebounceTimer = setTimeout(() => {
      this.zone.run(() => {
        // Minimal change detection on scroll
        this.cdRef.markForCheck();
      });
    }, 150);
  }

  private setupValueChangeSubscription() {
    this.kvListItems.valueChanges
      .pipe(
        debounceTime(this.isLargeDataset ? (this.kvListItems.length > 5000 ? 800 : 500) : 300), // Much longer debounce for very large datasets
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        if (this.processingChunk) {
          return; // Skip processing during chunk loading
        }

        // For very large datasets, batch processing to prevent UI blocking
        if (this.isLargeDataset && this.kvListItems.length > 5000) {
          this.zone.runOutsideAngular(() => {
            setTimeout(() => {
              this.zone.run(() => {
                this.processValueChanges(data);
              });
            }, 10);
          });
        } else {
          this.processValueChanges(data);
        }
      });
  }

  private setupOptimizedValueChangeSubscription() {
    this.kvListItems.valueChanges
      .pipe(
        debounceTime(this.isLargeDataset ? (this.kvListItems.length > 5000 ? 800 : 500) : 300), // Much longer debounce for very large datasets
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        if (this.processingChunk) {
          return; // Skip processing during chunk loading
        }

        // For very large datasets, batch processing to prevent UI blocking
        if (this.isLargeDataset && this.kvListItems.length > 5000) {
          this.zone.runOutsideAngular(() => {
            setTimeout(() => {
              this.zone.run(() => {
                this.processValueChanges(data);
              });
            }, 10);
          });
        } else {
          this.processValueChanges(data);
        }
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
    if (!this.formManagement.validateListSize(this.kvListItems, this.configuration)) {
      return;
    }

    // For very large datasets, use optimized operations from shared service
    if (this.performanceService.shouldNeedOptimization(this.kvListItems.length, 5000)) {
      const callbacks: FormManagementCallbacks = {
        refreshControlsCache: () => this.refreshKvControlsCache(),
        setChildConfigFormValidity: () => this.setChildConfigFormValidity(),
        formStatusEvent: (status) => this.formStatusEvent.emit(status)
      };

      this.formManagement.addListItemOptimized(
        this.kvListItems,
        () => this.initListItem(isPrepend, { key: '', value: '' }),
        isPrepend,
        this.performanceState,
        this.cdRef,
        callbacks,
        this.group
      );
      return;
    }

    // Standard processing for smaller datasets
    if (isPrepend) {
      this.kvListItems.insert(0, this.initListItem(isPrepend, { key: '', value: '' }));
    } else {
      this.kvListItems.push(this.initListItem(isPrepend, { key: '', value: '' }));
    }
    this.formStatusEvent.emit({ 'status': this.kvListItems.valid, 'group': this.group });

    if (this.configuration.items == 'object') {
      const index = isPrepend ? 0 : this.kvListItems.length - 1;
      if (this.isListView) {
        this.scrollToRow(index);
      } else {
        this.expandListItem(index);
      }
    }

    this.refreshKvControlsCache();
    this.cdRef.detectChanges();
  }

  scrollToRow(i) {
    this.domOperations.scrollToRow(this.configuration.key, i, this.from);
  }

  removeListItem(index: number) {
    const callbacks: FormManagementCallbacks = {
      refreshControlsCache: () => this.refreshKvControlsCache(),
      setChildConfigFormValidity: () => this.setChildConfigFormValidity(),
      formStatusEvent: (status) => this.formStatusEvent.emit(status)
    };

    this.formManagement.removeListItemOptimized(
      this.kvListItems,
      index,
      this.initialProperties,
      this.items,
      this.performanceState,
      this.thresholds,
      this.cdRef,
      callbacks
    );
  }

  getChangedConfiguration(index: string, propertyChangedValues: any) {
    this.kvListItems.controls[index].controls['value'].patchValue(propertyChangedValues);
  }

  formStatus(formState: any, index) {
    const callbacks: FormManagementCallbacks = {
      refreshControlsCache: () => this.refreshKvControlsCache(),
      setChildConfigFormValidity: () => this.setChildConfigFormValidity(),
      formStatusEvent: (status) => this.formStatusEvent.emit(status)
    };

    this.formManagement.handleFormStatusUpdate(
      formState,
      index,
      this.items,
      this.performanceState,
      this.kvListItems,
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
      this.kvListItems.length,
      this.configuration.key,
      this.from,
      this.thresholds,
      this.isLargeDataset
    );
  }

  collapseAllItems() {
    this.domOperations.collapseAllItems(
      this.kvListItems.length,
      this.configuration.key,
      this.from,
      this.thresholds,
      this.isLargeDataset
    );
  }

  appendFileData(event) {
    const appendStartTime = performance.now();
    const dataLength = event.fileData ? Object.keys(event.fileData).length : 0;
    console.log(`🚀 KV-LIST APPEND START: Adding ${dataLength} entries to existing ${this.kvListItems.length} entries, Category=${this.categoryName}, Config=${this.configuration.key}`);

    // Mark this as a file import operation
    this.isFileImportOperation = true;

    // Show loading indicator for large file imports
    if (event.fileData && Object.keys(event.fileData).length > 1000) {
      console.log(`⚡ Using chunked processing for large KV append operation`);
      this.isLoadingLargeDataset = true;
      this.formStatusEvent.emit({ 'status': false, 'group': this.group, 'loading': true });
      this.cdRef.detectChanges();

      // Process large file data in chunks
      this.processLargeFileData(event.fileData, false, appendStartTime);
    } else {
      console.log(`🏃 Using standard processing for small KV append operation`);
      // Process normally for smaller files - this fixes the preview issue
      const processingStartTime = performance.now();
      for (const [key, value] of Object.entries(event.fileData)) {
        this.kvListItems.push(this.initListItem(false, { key, value }));
      }
      const processingEndTime = performance.now();

      console.log(`✅ Standard KV append processing: ${processingEndTime - processingStartTime}ms for ${dataLength} entries`);
      this.cdRef.detectChanges();
      // Reset file import flag
      this.isFileImportOperation = false;

      const appendEndTime = performance.now();
      console.log(`🎉 TOTAL KV-LIST APPEND TIME: ${appendEndTime - appendStartTime}ms - Added ${dataLength} entries (Total now: ${this.kvListItems.length})`);
    }
  }

  overrideFileData(event) {
    const overrideStartTime = performance.now();
    const dataLength = event.fileData ? Object.keys(event.fileData).length : 0;
    const existingItemCount = this.kvListItems.length;
    console.log(`🚀 KV-LIST OVERRIDE START: Replacing ${existingItemCount} entries with ${dataLength} new entries, Category=${this.categoryName}, Config=${this.configuration.key}`);

    // Mark this as a file import operation
    this.isFileImportOperation = true;

    // Show loading indicator for large file imports
    if (event.fileData && Object.keys(event.fileData).length > 1000) {
      console.log(`⚡ Using chunked processing for large KV override operation`);
      this.isLoadingLargeDataset = true;
      this.kvListItems.clear();
      this.initialProperties = [];
      this.formStatusEvent.emit({ 'status': false, 'group': this.group, 'loading': true });
      this.cdRef.detectChanges();

      // Process large file data in chunks
      this.processLargeFileData(event.fileData, true, overrideStartTime);
    } else {
      console.log(`🏃 Using standard processing for small KV override operation`);
      // Process normally for smaller files - this fixes the preview issue
      const clearStartTime = performance.now();
      this.kvListItems.clear();
      this.initialProperties = [];
      const clearEndTime = performance.now();
      console.log(`🗑️ KV List cleared: ${clearEndTime - clearStartTime}ms`);

      const processingStartTime = performance.now();
      for (const [key, value] of Object.entries(event.fileData)) {
        this.kvListItems.push(this.initListItem(false, { key, value }));
      }
      const processingEndTime = performance.now();

      console.log(`✅ Standard KV override processing: ${processingEndTime - processingStartTime}ms for ${dataLength} entries`);
      this.cdRef.detectChanges();
      // Reset file import flag
      this.isFileImportOperation = false;

      const overrideEndTime = performance.now();
      console.log(`🎉 TOTAL KV-LIST OVERRIDE TIME: ${overrideEndTime - overrideStartTime}ms - Replaced ${existingItemCount} with ${dataLength} entries`);
    }
  }

  private processLargeFileData(fileData: any, isOverride: boolean, operationStartTime?: number) {
    const chunkingStartTime = performance.now();
    const entries = Object.entries(fileData);
    console.log(`🔄 KV-LIST CHUNKED PROCESSING START: ${isOverride ? 'Override' : 'Append'} with ${entries.length} entries`);

    this.cdRef.detach();
    this.processingChunk = true;

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

    console.log(`📊 KV Chunking parameters: ChunkSize=${chunkSize}, Delay=${delay}ms`);

    let currentIndex = 0;
    let processedCount = 0;

    const processChunk = () => {
      const endIndex = Math.min(currentIndex + chunkSize, entries.length);

      // Use zone outside to prevent multiple change detection cycles
      this.zone.runOutsideAngular(() => {
        for (let i = currentIndex; i < endIndex; i++) {
          this.zone.run(() => {
            const [key, value] = entries[i];
            this.kvListItems.push(this.initListItem(false, { key, value }));
            processedCount++;
          });
        }
      });

      // Log progress every 5000 entries
      if (processedCount % 5000 === 0 || endIndex === entries.length) {
        console.log(`📈 KV Chunk Progress: ${processedCount}/${entries.length} entries processed`);
      }

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
        const chunkingEndTime = performance.now();
        console.log(`✅ KV-LIST CHUNKED PROCESSING COMPLETE: ${chunkingEndTime - chunkingStartTime}ms for ${entries.length} entries`);

        this.processingChunk = false;
        this.isLoadingLargeDataset = false;
        this.cdRef.reattach();
        this.cdRef.detectChanges();

        // Emit loading complete
        this.formStatusEvent.emit({ 'status': this.kvListItems.valid, 'group': this.group, 'loading': false });
        // Reset file import flag
        this.isFileImportOperation = false;

        if (operationStartTime) {
          const totalOperationTime = chunkingEndTime - operationStartTime;
          console.log(`🎉 TOTAL KV-LIST ${isOverride ? 'OVERRIDE' : 'APPEND'} TIME: ${totalOperationTime}ms - Processed ${entries.length} entries (Total now: ${this.kvListItems.length})`);
        }
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
    const exportPrepStartTime = performance.now();
    const dataSize = this.kvListItems.length;
    console.log(`🚀 KV-LIST EXPORT PREPARATION START: ${dataSize} entries, Category=${this.categoryName}, Config=${this.configuration.key}`);

    // Show loading indicator during export preparation
    this.isExportingData = true;
    this.cdRef.detectChanges();

    this.hideDropDown();

    // Check if we have a large dataset that needs async processing
    if (dataSize > 1000) {
      console.log(`⚡ Using async preparation for large KV dataset`);
      // Process large datasets asynchronously to prevent blocking
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.prepareKvListData(exportPrepStartTime);
            this.isExportingData = false; // Hide loading indicator
            this.cdRef.detectChanges();
            this.fileExportModal.toggleModal(true);
          });
        }, 10); // Small delay to let UI update
      });
    } else {
      console.log(`🏃 Using sync preparation for small KV dataset`);
      // Process small datasets immediately but still show loading briefly
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.prepareKvListData(exportPrepStartTime);
            this.isExportingData = false; // Hide loading indicator
            this.cdRef.detectChanges();
            this.fileExportModal.toggleModal(true);
          });
        }, 50); // Brief delay to show loading indicator
      });
    }
  }

  private prepareKvListData(prepStartTime?: number) {
    const dataStartTime = performance.now();
    const entryCount = this.kvListItems.value.length;
    console.log(`🔄 KV-LIST DATA PREPARATION START: Converting ${entryCount} form entries to key-value object`);

    this.kvlistValues = {};
    for (let [ind, val] of this.kvListItems.value.entries()) {
      this.kvlistValues[val.key] = val.value;
    }

    const dataEndTime = performance.now();
    const finalKeyCount = Object.keys(this.kvlistValues).length;
    console.log(`✅ KV-LIST DATA PREPARATION COMPLETE: ${dataEndTime - dataStartTime}ms, Converted ${entryCount} entries to ${finalKeyCount} key-value pairs`);

    if (prepStartTime) {
      const totalPrepTime = dataEndTime - prepStartTime;
      console.log(`🎯 TOTAL KV-LIST EXPORT PREPARATION TIME: ${totalPrepTime}ms for ${finalKeyCount} entries`);
    }
  }

  toggleDropdown() {
    this.domOperations.toggleDropdown(this.configuration?.key);
  }

  hideDropDown() {
    this.domOperations.hideDropDown(this.configuration?.key);
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
