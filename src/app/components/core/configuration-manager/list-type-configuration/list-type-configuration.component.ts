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

    // Check if we should defer initial loading (for quickview scenarios)
    this.checkDeferredLoading();

    if (this.initialLoadDeferred) {
      console.log(`List: Using deferred loading for "${this.from}" context`);
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
      console.log(`List: Using immediate loading`);
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

    // For initial data loading: show visual loading feedback but don't disable buttons
    // For file import: emit loading state that disables buttons
    if (values.length > 200) { // Reduced from 1000 to 200
      if (this.isFileImportOperation) {
        // File import - disable buttons
        this.isLoadingLargeDataset = true;
        this.formStatusEvent.emit({ status: false, group: this.group, loading: true });
      } else {
        // Initial data loading - visual feedback only, don't disable buttons
        this.isLoadingInitialData = true;
      }
      this.cdRef.detectChanges();
    }

    // Use chunked processing for datasets over 200 items (reduced from 1000)
    if (values.length > 200) {
      console.log(`List: Using chunked processing for ${values.length} items`);
      this.processValuesChunked(values, t0);
    } else {
      // Process normally for smaller datasets (faster)
      console.log(`List: Using normal processing for ${values.length} items`);
      for (let i = 0; i < values.length; i++) {
        this.initListItem(false, values[i]);
      }
      this.hasInitiallyLoaded = true;
      this.cdRef.detectChanges();

      const t1 = performance.now();
      console.log(`List form creation took ${t1 - t0} ms for ${values.length} items (normal processing)`);

      if (this.isLoadingLargeDataset) {
        this.isLoadingLargeDataset = false;
        this.formStatusEvent.emit({ status: this.listItems.valid, group: this.group, loading: false });
        this.cdRef.detectChanges();
      }
    }
  }

  private processValuesChunked(values: any[], startTime: number) {
    // Detach change detection for bulk operations
    this.cdRef.detach();
    this.processingChunk = true;

    // Optimized chunking based on dataset size
    let chunkSize, delay;
    if (values.length > 10000) {
      // 10k+ items: large chunks with moderate delays
      chunkSize = 500;
      delay = 50;
    } else if (values.length > 5000) {
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
      const endIndex = Math.min(currentIndex + chunkSize, values.length);

      // Use zone outside to prevent multiple change detection cycles
      this.zone.runOutsideAngular(() => {
        for (let i = currentIndex; i < endIndex; i++) {
          this.zone.run(() => {
            this.initListItem(false, values[i]);
          });
        }
      });

      currentIndex = endIndex;

      if (currentIndex < values.length) {
        // Use optimized scheduling for form creation
        this.zone.runOutsideAngular(() => {
          if ('requestIdleCallback' in window && values.length > 5000) {
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
        console.log(`List form creation took ${t1 - startTime} ms for ${values.length} items (chunked processing)`);

        // Only emit loading complete for file import operations
        if (this.isFileImportOperation) {
          this.formStatusEvent.emit({ status: this.listItems.valid, group: this.group, loading: false });
        }
      }
    };

    // Start processing with a small initial delay to let UI settle
    setTimeout(() => processChunk(), 10);
  }

  private setupValueChangeSubscription() {
    this.listItems.valueChanges
      .pipe(
        debounceTime(this.isLargeDataset ? 500 : 300), // Longer debounce for large datasets
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

        this.changedConfig.emit({
          [this.configuration.key]: JSON.stringify(processedValue),
        });

        this.formStatusEvent.emit({
          status: this.listItems.valid,
          group: this.group,
        });
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

    // Only optimize for very large datasets
    if (this.isLargeDataset && this.listItems.length > 3000) {
      this.cdRef.detach();
    }

    this.initListItem(isPrepend);
    this.formStatusEvent.emit({ status: this.listItems.valid, group: this.group });
    if (this.configuration.items === 'object') {
      const index = isPrepend ? 0 : this.listItems.length - 1;
      if (this.isListView) {
        this.scrollToRow(index);
      } else {
        this.expandListItem(index);
      }
    }

    // Refresh cached controls after adding item
    this.refreshControlsCache();

    // Reattach change detection for very large datasets
    if (this.isLargeDataset && this.listItems.length > 3000) {
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.cdRef.reattach();
            this.cdRef.detectChanges();
          });
        }, 0);
      });
    } else {
      // Step 1: Trigger DOM update
      this.cdRef.detectChanges();

      // Step 2: Wait for rendering to finish
      if (this.viewport) {
        this.zone.runOutsideAngular(() => {
          requestAnimationFrame(() => {
            this.viewport.checkViewportSize();

            // Step 3: Scroll after layout is fully calculated
            setTimeout(() => {
              this.viewport.scrollToIndex(this.listItems.length - 1, 'smooth');
            }, 0);
          });
        });
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
    // More aggressive optimization for very large datasets (10k+)
    // Use lower threshold for deletion operations as they are more expensive
    const needsOptimization = this.listItems.length > this.DELETION_OPTIMIZATION_THRESHOLD;

    if (needsOptimization) {
      // For very large datasets, completely detach and use zone outside
      this.cdRef.detach();

      this.zone.runOutsideAngular(() => {
        // Perform deletion operations outside Angular zone
        this.listItems.removeAt(index);
        this.initialProperties.splice(index, 1);
        this.items.splice(index, 1);

        this.zone.run(() => {
          this.setChildConfigFormValidity();

          // Refresh cached controls after removing item
          this.refreshControlsCache();

          // Use longer delay for very large datasets to prevent UI blocking
          setTimeout(() => {
            this.cdRef.reattach();
            this.cdRef.detectChanges();
          }, this.listItems.length > 15000 ? 200 : 100);
        });
      });
    } else if (this.isLargeDataset && this.listItems.length > 5000) {
      // Medium optimization for moderately large datasets
      this.cdRef.detach();

      this.listItems.removeAt(index);
      this.initialProperties.splice(index, 1);
      this.items.splice(index, 1);
      this.setChildConfigFormValidity();

      // Refresh cached controls after removing item
      this.refreshControlsCache();

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
      this.listItems.removeAt(index);
      this.initialProperties.splice(index, 1);
      this.items.splice(index, 1);
      this.setChildConfigFormValidity();
      this.cdRef.detectChanges();

      // Step 1: Trigger DOM update
      // Step 2: Wait for rendering to finish
      if (this.viewport) {
        this.zone.runOutsideAngular(() => {
          requestAnimationFrame(() => {
            this.viewport.checkViewportSize();

            // Step 3: Scroll after layout is fully calculated
            setTimeout(() => {
              this.viewport.scrollToIndex(this.listItems.length - 1, 'smooth');
            }, 0);
          });
        });
      }
    }
  }

  getChangedConfiguration(index, propertyChangedValues: any) {
    this.listItems.controls[index].patchValue(propertyChangedValues);
  }

  formStatus(formState: any, index) {
    // Only optimize form status updates for very large datasets
    if (this.isLargeDataset && this.listItems.length > 3000) {
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
    if (this.listItems.length > this.DOM_OPERATION_THRESHOLD) {
      this.expandAllItemsChunked();
    } else {
      for (let i = 0; i < this.listItems.length; i++) {
        this.expandCollapseSingleItem(i, true);
      }
    }
  }

  collapseAllItems() {
    // Use chunked processing only for very large datasets (DOM operations are fast)
    if (this.listItems.length > this.DOM_OPERATION_THRESHOLD) {
      this.collapseAllItemsChunked();
    } else {
      for (let i = 0; i < this.listItems.length; i++) {
        this.expandCollapseSingleItem(i, false);
      }
    }
  }

  private expandAllItemsChunked() {
    const chunkSize = 100; // Larger chunks for DOM operations (much faster than form creation)
    let currentIndex = 0;

    const processChunk = () => {
      const endIndex = Math.min(currentIndex + chunkSize, this.listItems.length);

      for (let i = currentIndex; i < endIndex; i++) {
        this.expandCollapseSingleItem(i, true);
      }

      currentIndex = endIndex;

      if (currentIndex < this.listItems.length) {
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
      const endIndex = Math.min(currentIndex + chunkSize, this.listItems.length);

      for (let i = currentIndex; i < endIndex; i++) {
        this.expandCollapseSingleItem(i, false);
      }

      currentIndex = endIndex;

      if (currentIndex < this.listItems.length) {
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
    if (event.fileData && event.fileData.length > 1000) {
      this.isLoadingLargeDataset = true;
      this.formStatusEvent.emit({ status: false, group: this.group, loading: true });
      this.cdRef.detectChanges();

      // Process large file data in chunks
      this.processLargeFileData(event.fileData, false);
    } else {
      // Process normally for smaller files - this fixes the preview issue
      event.fileData.forEach(element => {
        this.initListItem(false, element);
      });
      this.cdRef.detectChanges();
      // Reset file import flag
      this.isFileImportOperation = false;
    }
  }

  overrideFileData(event) {
    // Mark this as a file import operation
    this.isFileImportOperation = true;

    // Show loading indicator for large file imports
    if (event.fileData && event.fileData.length > 1000) {
      this.isLoadingLargeDataset = true;
      this.listItems.clear();
      this.initialProperties = [];
      this.formStatusEvent.emit({ status: false, group: this.group, loading: true });
      this.cdRef.detectChanges();

      // Process large file data in chunks
      this.processLargeFileData(event.fileData, true);
    } else {
      // Process normally for smaller files - this fixes the preview issue
      this.listItems.clear();
      this.initialProperties = [];
      event.fileData.forEach(element => {
        this.initListItem(false, element);
      });
      this.cdRef.detectChanges();
      // Reset file import flag
      this.isFileImportOperation = false;
    }
  }

  private processLargeFileData(fileData: any[], isOverride: boolean) {
    this.cdRef.detach();
    this.processingChunk = true;

    // Use optimized chunking for file imports - same as initial loading
    let chunkSize, delay;
    if (fileData.length > 10000) {
      // 10k+ files: large chunks with moderate delays
      chunkSize = 500;
      delay = 50;
    } else if (fileData.length > 5000) {
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
      const endIndex = Math.min(currentIndex + chunkSize, fileData.length);

      // Use zone outside to prevent multiple change detection cycles
      this.zone.runOutsideAngular(() => {
        for (let i = currentIndex; i < endIndex; i++) {
          this.zone.run(() => {
            this.initListItem(false, fileData[i]);
          });
        }
      });

      currentIndex = endIndex;

      if (currentIndex < fileData.length) {
        this.zone.runOutsideAngular(() => {
          if ('requestIdleCallback' in window && fileData.length > 5000) {
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
        this.formStatusEvent.emit({ status: this.listItems.valid, group: this.group, loading: false });
        // Reset file import flag
        this.isFileImportOperation = false;
      }
    };

    // Start processing with a small initial delay
    setTimeout(() => processChunk(), 10);
  }

  openModal() {
    this.hideDropDown();
    // Ensure modal state is reset when opening
    this.fileImportModal.toggleModal(true);
  }

  openExportFileModal() {
    this.hideDropDown();

    // Check if we have a large dataset that needs async processing
    const dataSize = this.listItems.length;

    if (dataSize > 1000) {
      // Process large datasets asynchronously to prevent blocking
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.prepareListData();
            this.fileExportModal.toggleModal(true);
          });
        }, 10); // Small delay to let UI update
      });
    } else {
      // Process small datasets immediately
      this.prepareListData();
      this.fileExportModal.toggleModal(true);
    }
  }

  private prepareListData() {
    this.listValues = this.listItems.value;
    this.listValues = uniqWith(this.listValues, isEqual);
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
    const needsViewSwitchingIndicator = this.listItems.length > this.VIEW_SWITCHING_THRESHOLD;

    if (needsViewSwitchingIndicator) {
      this.isViewSwitching = true;
      this.formStatusEvent.emit({ status: false, group: this.group, loading: true });
      this.cdRef.detectChanges();

      // Simplified and faster view switching
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
        }, 50); // Reduced delay for faster switching
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
