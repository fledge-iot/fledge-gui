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

  @ViewChild(CdkVirtualScrollViewport, { static: false }) viewport: CdkVirtualScrollViewport;

  private destroy$ = new Subject<void>();
  private processingChunk = false;

  // Performance optimization properties with different thresholds for different operations
  isLoadingLargeDataset = false;
  isViewSwitching = false; // Smart view switching indicator
  private LARGE_DATASET_THRESHOLD = 500; // For showing loading indicators
  private FORM_CREATION_THRESHOLD = 1000; // For conservative form creation chunking
  private DOM_OPERATION_THRESHOLD = 3000; // For DOM manipulation chunking (higher threshold)
  private PERFORMANCE_MODE_THRESHOLD = 1000; // For performance optimizations
  private VIEW_SWITCHING_THRESHOLD = 2000; // Only show view switching indicator for very large datasets
  private isLargeDataset = false; // Track if we have large dataset for optimizations

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

    this.loadDataWithChunking();
    this.setupValueChangeSubscription();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDataWithChunking() {
    let values = this.configuration?.value ?? this.configuration.default;
    const t0 = performance.now();

    try {
      values = JSON.parse(values);
    } catch (e) {
      console.error('Error parsing list values:', e);
      values = [];
    }

    if (this.configuration.listName) {
      values = values[this.configuration.listName];
    }

    if (!Array.isArray(values) || values.length === 0) {
      this.cdRef.detectChanges();
      return;
    }

    // Track if this is a large dataset for performance optimizations
    this.isLargeDataset = values.length > this.PERFORMANCE_MODE_THRESHOLD;

    // Show loading indicator for large datasets
    if (values.length > this.LARGE_DATASET_THRESHOLD) {
      this.isLoadingLargeDataset = true;
      this.cdRef.detectChanges();
    }

    // Detach change detection for bulk operations
    this.cdRef.detach();
    this.processingChunk = true;

    // Conservative chunking for form creation based on FORM_CREATION_THRESHOLD
    let chunkSize, delay;
    if (values.length > this.FORM_CREATION_THRESHOLD) {
      // Use conservative chunking for form creation to prevent crashes
      if (values.length > 10000) {
        // 10k+ items: very small chunks with longer delays
        chunkSize = 5;
        delay = 50;
      } else if (values.length > 5000) {
        // 5k-10k items: small chunks with moderate delays  
        chunkSize = 10;
        delay = 30;
      } else {
        // 1k-5k items: moderate chunks with small delays
        chunkSize = 20;
        delay = 15;
      }
    } else {
      // < 1k items: larger chunks with minimal delays
      chunkSize = 50;
      delay = 5;
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
        // Use conservative scheduling for form creation
        this.zone.runOutsideAngular(() => {
          if ('requestIdleCallback' in window && values.length > 5000) {
            // Use browser idle time for large datasets
            requestIdleCallback(() => {
              this.zone.run(() => processChunk());
            }, { timeout: delay + 100 });
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

        const t1 = performance.now();
        console.log(`List form creation took ${t1 - t0} ms for ${values.length} items`);
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
    return [...this.listItems.controls]; // returns a new reference
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

    // Optimize for large datasets
    if (this.isLargeDataset) {
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

    // Reattach change detection for large datasets
    if (this.isLargeDataset) {
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
    // Optimize for large datasets
    if (this.isLargeDataset) {
      this.cdRef.detach();
    }

    this.listItems.removeAt(index);
    this.initialProperties.splice(index, 1);
    this.items.splice(index, 1);
    this.setChildConfigFormValidity();

    // Reattach change detection for large datasets
    if (this.isLargeDataset) {
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.cdRef.reattach();
            this.cdRef.detectChanges();
          });
        }, 0);
      });
    }
  }

  getChangedConfiguration(index, propertyChangedValues: any) {
    this.listItems.controls[index].patchValue(propertyChangedValues);
  }

  formStatus(formState: any, index) {
    // Optimize form status updates for large datasets
    if (this.isLargeDataset) {
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
    // Show loading indicator for large file imports
    if (event.fileData && event.fileData.length > this.LARGE_DATASET_THRESHOLD) {
      this.isLoadingLargeDataset = true;
      this.cdRef.detectChanges();

      // Process large file data in chunks
      this.processLargeFileData(event.fileData, false);
    } else {
      event.fileData.forEach(element => {
        this.initListItem(false, element);
      });
    }
  }

  overrideFileData(event) {
    // Show loading indicator for large file imports
    if (event.fileData && event.fileData.length > this.LARGE_DATASET_THRESHOLD) {
      this.isLoadingLargeDataset = true;
      this.listItems.clear();
      this.initialProperties = [];
      this.cdRef.detectChanges();

      // Process large file data in chunks
      this.processLargeFileData(event.fileData, true);
    } else {
      this.listItems.clear();
      this.initialProperties = [];
      event.fileData.forEach(element => {
        this.initListItem(false, element);
      });
    }
  }

  private processLargeFileData(fileData: any[], isOverride: boolean) {
    this.cdRef.detach();
    this.processingChunk = true;

    // Use conservative chunking for file imports based on FORM_CREATION_THRESHOLD
    let chunkSize, delay;
    if (fileData.length > this.FORM_CREATION_THRESHOLD) {
      // Use conservative chunking for form creation to prevent crashes
      if (fileData.length > 10000) {
        // 10k+ files: very small chunks with longer delays
        chunkSize = 5;
        delay = 50;
      } else if (fileData.length > 5000) {
        // 5k-10k files: small chunks with moderate delays  
        chunkSize = 10;
        delay = 30;
      } else {
        // 1k-5k files: moderate chunks with small delays
        chunkSize = 20;
        delay = 15;
      }
    } else {
      // < 1k files: larger chunks with minimal delays
      chunkSize = 50;
      delay = 5;
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
            }, { timeout: delay + 100 });
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
    // Smart view switching - only show loading for very large datasets
    const needsViewSwitchingIndicator = this.listItems.length > this.VIEW_SWITCHING_THRESHOLD;
    const isVeryLargeDataset = this.listItems.length > 4000; // Extra safety for 5k+ data
    const isExtremelyLarge = this.listItems.length > 8000; // Ultra conservative for 8k+

    if (needsViewSwitchingIndicator) {
      this.isViewSwitching = true;
      this.cdRef.detectChanges();

      // Use zone.runOutsideAngular for the entire process to prevent blocking
      this.zone.runOutsideAngular(() => {
        // Much longer delay for very large datasets to prevent crashes
        const initialDelay = isExtremelyLarge ? 500 : (isVeryLargeDataset ? 200 : 50);

        setTimeout(() => {
          this.zone.run(() => {
            // Detach change detection for very large datasets to prevent crashes
            if (isVeryLargeDataset) {
              this.cdRef.detach();
            }

            this.isListView = event.isListView;
          });

          // Progressive rendering delay - much longer for detailed view with large data
          const renderDelay = isExtremelyLarge ? 1000 : (isVeryLargeDataset && !event.isListView) ? 600 : 100;

          setTimeout(() => {
            this.zone.run(() => {
              // Expand first item if switching to detailed view with exactly one item
              if (!this.isListView && this.listItems.length === 1) {
                setTimeout(() => {
                  this.expandListItem(0);
                }, 50);
              }

              // Final delay before hiding indicator
              setTimeout(() => {
                // Reattach change detection for very large datasets
                if (isVeryLargeDataset) {
                  this.cdRef.reattach();
                }

                this.isViewSwitching = false;
                this.cdRef.detectChanges();
              }, 200);
            });
          }, renderDelay);
        }, initialDelay);
      });
    } else {
      // Instant switching for smaller datasets
      this.isListView = event.isListView;

      // Only expand first item if switching to detailed view and there's exactly one item
      if (!this.isListView && this.listItems.length === 1) {
        setTimeout(() => {
          this.expandListItem(0);
        }, 50);
      }

      this.cdRef.detectChanges();
    }
  }
}
