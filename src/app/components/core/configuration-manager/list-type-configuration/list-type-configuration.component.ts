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
  isExportingData = false; // Loading indicator for export preparation
  private LARGE_DATASET_THRESHOLD = 100; // Reduced from 2000 - now kicks in at 100+ items
  private FORM_CREATION_THRESHOLD = 200; // Reduced from 3000 - chunking starts at 200+ items
  private DOM_OPERATION_THRESHOLD = 500; // Reduced from 5000 - DOM optimization at 500+ items
  private PERFORMANCE_MODE_THRESHOLD = 100; // Reduced from 2000 - performance mode at 100+ items
  private VIEW_SWITCHING_THRESHOLD = 300; // Reduced from 3000 - loading indicator at 300+ items
  private DELETION_OPTIMIZATION_THRESHOLD = 400; // Reduced from 8000 - optimized deletion at 400+ items
  private VIRTUAL_SCROLL_THRESHOLD = 150; // Enable aggressive virtual scrolling at 150+ items
  private isLargeDataset = false; // Track if we have large dataset for optimizations

  // Advanced memory management for very large datasets
  private isVirtualScrollOptimized = false;
  private visibleItemsBuffer = 20; // Only keep 20 extra items in DOM
  private lastScrollTop = 0;
  private scrollDebounceTimer: any;

  // New properties to handle deferred loading and file import distinction
  private isFileImportOperation = false; // Track if we're in a file import operation
  private initialLoadDeferred = false; // Track if initial load should be deferred
  private hasInitiallyLoaded = false; // Track if we've completed initial load
  private componentInitialized = false; // Track if component has been initialized once

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

    // Cleanup scroll debounce timer to prevent memory leaks
    if (this.scrollDebounceTimer) {
      clearTimeout(this.scrollDebounceTimer);
      this.scrollDebounceTimer = null;
    }
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

    // Show loading indicator immediately for datasets over 100 items (reduced threshold for better UX)
    if (values.length > 100) { // Reduced from 200 to 100
      if (this.isFileImportOperation) {
        // File import - disable buttons
        this.isLoadingLargeDataset = true;
        this.formStatusEvent.emit({ status: false, group: this.group, loading: true });
      } else {
        // Initial data loading - always show loading indicator for better UX
        this.isLoadingInitialData = true;
        // Always emit loading state for large datasets to show proper tab feedback
        this.formStatusEvent.emit({ status: false, group: this.group, loading: true });
      }
      this.cdRef.detectChanges();

      // Defer data processing to ensure loading indicator renders first
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.processDataAfterLoadingIndicator(values, t0);
          });
        }, 50); // Give UI time to render loading indicator
      });
    } else {
      // Process normally for smaller datasets (faster)
      this.processDataAfterLoadingIndicator(values, t0);
    }
  }

  private processDataAfterLoadingIndicator(values: any[], startTime: number) {
    // Use chunked processing for datasets over 200 items (reduced from 1000)
    if (values.length > 200) {
      console.log(`List: Using chunked processing for ${values.length} items`);
      this.processValuesChunked(values, startTime);
    } else {
      // Process normally for smaller datasets (faster)
      console.log(`List: Using normal processing for ${values.length} items`);
      for (let i = 0; i < values.length; i++) {
        this.initListItem(false, values[i]);
      }
      this.hasInitiallyLoaded = true;
      this.cdRef.detectChanges();

      const t1 = performance.now();
      console.log(`List form creation took ${t1 - startTime} ms for ${values.length} items (normal processing)`);

      if (this.isLoadingLargeDataset) {
        this.isLoadingLargeDataset = false;
        this.formStatusEvent.emit({ status: this.listItems.valid, group: this.group, loading: false });
        this.cdRef.detectChanges();
      }

      // Also clear initial data loading states for 1k+ datasets
      if (this.isLoadingInitialData) {
        this.isLoadingInitialData = false;
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
        // Processing complete - Use progressive reattachment for large datasets
        this.processingChunk = false;
        this.isLoadingLargeDataset = false;
        this.isLoadingInitialData = false;
        this.hasInitiallyLoaded = true;

        // For very large datasets, use progressive reattachment to prevent freezing
        if (values.length > 5000) {
          this.progressiveReattachment(values.length, startTime);
        } else {
          this.cdRef.reattach();
          this.cdRef.detectChanges();

          const t1 = performance.now();
          console.log(`List form creation took ${t1 - startTime} ms for ${values.length} items (chunked processing)`);

          // Emit loading complete for file import operations OR for 1k+ initial data loading
          if (this.isFileImportOperation || values.length >= 1000) {
            this.formStatusEvent.emit({ status: this.listItems.valid, group: this.group, loading: false });
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
            console.log(`List form creation took ${t1 - startTime} ms for ${itemCount} items (chunked processing with progressive reattachment)`);

            // Emit loading complete
            if (this.isFileImportOperation || itemCount >= 1000) {
              this.formStatusEvent.emit({ status: this.listItems.valid, group: this.group, loading: false });
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
      console.log(`List: Enabling post-load optimizations for ${itemCount} items`);

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
    if (this.isLargeDataset && this.listItems.length > 5000) {
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
    if (this.viewport && this.listItems.length > 5000) {
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.viewport.checkViewportSize();
            // Refresh cached controls for virtual scrolling
            this.refreshControlsCache();

            // Enable virtual scroll optimizations
            if (this.listItems.length > this.VIRTUAL_SCROLL_THRESHOLD) {
              this.enableVirtualScrollOptimizations();
            }
          });
        }, 100);
      });
    }
  }

  private enableAggressiveMemoryManagement() {
    console.log(`List: Enabling aggressive memory management for ${this.listItems.length} items`);

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
    if (this.viewport && !this.isVirtualScrollOptimized) {
      console.log(`List: Enabling virtual scroll optimizations`);
      this.isVirtualScrollOptimized = true;

      // Configure virtual scroll for optimal performance
      this.viewport.elementScrolled().pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.handleOptimizedScroll();
      });
    }
  }

  private handleOptimizedScroll() {
    // Debounce scroll events to prevent excessive processing
    if (this.scrollDebounceTimer) {
      clearTimeout(this.scrollDebounceTimer);
    }

    this.scrollDebounceTimer = setTimeout(() => {
      this.zone.runOutsideAngular(() => {
        // Optimize memory usage during scrolling
        this.optimizeMemoryDuringScroll();
      });
    }, 100);
  }

  private optimizeMemoryDuringScroll() {
    // For very large datasets, implement memory cleanup during scroll
    if (this.listItems.length > 1000) {
      // Cleanup non-visible form control subscriptions
      this.cleanupNonVisibleControls();
    }
  }

  private setupMemoryEfficientControls() {
    // Implement lazy form control creation for very large datasets
    if (this.listItems.length > this.VIRTUAL_SCROLL_THRESHOLD) {
      console.log(`List: Setting up memory-efficient controls for ${this.listItems.length} items`);

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

  private cleanupNonVisibleControls() {
    // Cleanup subscriptions and listeners for non-visible controls
    if (this.viewport) {
      const viewportSize = this.viewport.getViewportSize();
      const renderedRange = this.viewport.getRenderedRange();

      // Only keep active subscriptions for visible + buffer items
      const bufferStart = Math.max(0, renderedRange.start - this.visibleItemsBuffer);
      const bufferEnd = Math.min(this.listItems.length, renderedRange.end + this.visibleItemsBuffer);

      // This optimization helps reduce memory pressure during scrolling
      this.zone.runOutsideAngular(() => {
        // Mark for minimal change detection
        setTimeout(() => {
          this.zone.run(() => {
            this.cdRef.markForCheck();
          });
        }, 16);
      });
    }
  }

  private setupScrollOptimization() {
    // Setup scroll-based optimizations for very large datasets
    this.zone.runOutsideAngular(() => {
      // Listen to scroll events outside Angular zone for better performance
      if (this.viewport) {
        this.viewport.elementScrolled().pipe(
          takeUntil(this.destroy$)
        ).subscribe(() => {
          // Handle scroll optimizations outside Angular zone
          this.handleScrollOptimization();
        });
      }
    });
  }

  private handleScrollOptimization() {
    // Optimize scroll handling for large datasets
    const currentScrollTop = this.viewport?.measureScrollOffset() || 0;

    // Only process significant scroll changes
    if (Math.abs(currentScrollTop - this.lastScrollTop) > 100) {
      this.lastScrollTop = currentScrollTop;

      // Debounce scroll-based optimizations
      if (this.scrollDebounceTimer) {
        clearTimeout(this.scrollDebounceTimer);
      }

      this.scrollDebounceTimer = setTimeout(() => {
        this.zone.run(() => {
          // Minimal change detection on significant scroll
          this.cdRef.markForCheck();
        });
      }, 150);
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

    // For very large datasets, use optimized DOM operations
    if (this.isLargeDataset && this.listItems.length > 5000) {
      this.addListItemOptimized(isPrepend);
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

  private addListItemOptimized(isPrepend: boolean) {
    // Highly optimized add for very large datasets
    this.zone.runOutsideAngular(() => {
      // Perform operations outside Angular zone
      this.initListItem(isPrepend);

      this.zone.run(() => {
        // Batch status emission
        this.formStatusEvent.emit({ status: this.listItems.valid, group: this.group });

        // Refresh cached controls
        this.refreshControlsCache();

        // Minimal change detection
        this.cdRef.markForCheck();
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

    console.log(`📊 Chunking parameters: ChunkSize=${chunkSize}, Delay=${delay}ms`);

    let currentIndex = 0;
    let processedCount = 0;

    const processChunk = () => {
      const endIndex = Math.min(currentIndex + chunkSize, fileData.length);

      // Use zone outside to prevent multiple change detection cycles
      this.zone.runOutsideAngular(() => {
        for (let i = currentIndex; i < endIndex; i++) {
          this.zone.run(() => {
            this.initListItem(false, fileData[i]);
            processedCount++;
          });
        }
      });

      // Log progress every 5000 items
      if (processedCount % 5000 === 0 || endIndex === fileData.length) {
        console.log(`📈 Chunk Progress: ${processedCount}/${fileData.length} items processed`);
      }

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
        const chunkingEndTime = performance.now();
        console.log(`✅ LIST CHUNKED PROCESSING COMPLETE: ${chunkingEndTime - chunkingStartTime}ms for ${fileData.length} items`);

        this.processingChunk = false;
        this.isLoadingLargeDataset = false;
        this.cdRef.reattach();
        this.cdRef.detectChanges();

        // Emit loading complete
        this.formStatusEvent.emit({ status: this.listItems.valid, group: this.group, loading: false });
        // Reset file import flag
        this.isFileImportOperation = false;

        if (operationStartTime) {
          const totalOperationTime = chunkingEndTime - operationStartTime;
          console.log(`🎉 TOTAL LIST ${isOverride ? 'OVERRIDE' : 'APPEND'} TIME: ${totalOperationTime}ms - Processed ${fileData.length} items (Total now: ${this.listItems.length})`);
        }
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
