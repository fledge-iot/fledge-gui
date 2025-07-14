import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
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

  private destroy$ = new Subject<void>();
  private processingChunk = false;

  // Performance optimization properties with different thresholds for different operations
  isLoadingLargeDataset = false;
  isViewSwitching = false; // Add back view switching indicator
  private LARGE_DATASET_THRESHOLD = 500; // For showing loading indicators
  private FORM_CREATION_THRESHOLD = 1000; // For conservative form creation chunking
  private DOM_OPERATION_THRESHOLD = 3000; // For DOM manipulation chunking (higher threshold)

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
    this.loadDataWithChunking();
    this.setupValueChangeSubscription();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDataWithChunking() {
    let values = this.configuration?.value ? this.configuration.value : this.configuration.default;
    const t0 = performance.now();

    try {
      values = JSON.parse(values);
    } catch (e) {
      console.error('Error parsing kvlist values:', e);
      values = {};
    }

    const entries = Object.entries(values);

    if (entries.length === 0) {
      this.cdRef.detectChanges();
      return;
    }

    // Show loading indicator for large datasets
    if (entries.length > this.LARGE_DATASET_THRESHOLD) {
      this.isLoadingLargeDataset = true;
      this.cdRef.detectChanges();
    }

    // Detach change detection for bulk operations
    this.cdRef.detach();
    this.processingChunk = true;

    // Conservative chunking for form creation based on FORM_CREATION_THRESHOLD
    let chunkSize, delay;
    if (entries.length > this.FORM_CREATION_THRESHOLD) {
      // Use conservative chunking for form creation to prevent crashes
      if (entries.length > 8000) {
        // Very large datasets: very small chunks with longer delays
        chunkSize = 5;
        delay = 50;
      } else if (entries.length > 3000) {
        // Large datasets: small chunks with moderate delays  
        chunkSize = 10;
        delay = 30;
      } else {
        // Medium datasets: moderate chunks with small delays
        chunkSize = 20;
        delay = 15;
      }
    } else {
      // Smaller datasets: larger chunks with minimal delays
      chunkSize = 50;
      delay = 5;
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
        // Use conservative scheduling for form creation
        this.zone.runOutsideAngular(() => {
          if ('requestIdleCallback' in window && entries.length > 3000) {
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
        console.log(`KvList form creation took ${t1 - t0} ms for ${entries.length} items`);
      }
    };

    // Start processing with a small initial delay to let UI settle
    setTimeout(() => processChunk(), 10);
  }

  private setupValueChangeSubscription() {
    this.kvListItems.valueChanges
      .pipe(
        debounceTime(300), // Increased debounce time for better performance
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

  trackByIndex(index: number, _item: any): number {
    return index;
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
      if (this.isListView) {
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
    // Add safety checks for DOM manipulation with timeout for heavy operations
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
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
      }, 0);
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
    // Show loading indicator for large file imports
    if (event.fileData && Object.keys(event.fileData).length > this.LARGE_DATASET_THRESHOLD) {
      this.isLoadingLargeDataset = true;
      this.cdRef.detectChanges();

      // Process large file data in chunks
      this.processLargeFileData(event.fileData, false);
    } else {
      for (const [key, value] of Object.entries(event.fileData)) {
        this.kvListItems.push(this.initListItem(false, { key, value }));
      }
    }
  }

  overrideFileData(event) {
    // Show loading indicator for large file imports
    if (event.fileData && Object.keys(event.fileData).length > this.LARGE_DATASET_THRESHOLD) {
      this.isLoadingLargeDataset = true;
      this.kvListItems.clear();
      this.initialProperties = [];
      this.cdRef.detectChanges();

      // Process large file data in chunks
      this.processLargeFileData(event.fileData, true);
    } else {
      this.kvListItems.clear();
      this.initialProperties = [];
      for (const [key, value] of Object.entries(event.fileData)) {
        this.kvListItems.push(this.initListItem(false, { key, value }));
      }
    }
  }

  private processLargeFileData(fileData: any, isOverride: boolean) {
    this.cdRef.detach();
    this.processingChunk = true;

    const entries = Object.entries(fileData);

    // Use conservative chunking for file imports based on FORM_CREATION_THRESHOLD
    let chunkSize, delay;
    if (entries.length > this.FORM_CREATION_THRESHOLD) {
      // Use conservative chunking for form creation to prevent crashes
      if (entries.length > 8000) {
        // Very large files: very small chunks with longer delays
        chunkSize = 5;
        delay = 50;
      } else if (entries.length > 3000) {
        // Large files: small chunks with moderate delays  
        chunkSize = 10;
        delay = 30;
      } else {
        // Medium files: moderate chunks with small delays
        chunkSize = 20;
        delay = 15;
      }
    } else {
      // Smaller files: larger chunks with minimal delays
      chunkSize = 50;
      delay = 5;
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
          if ('requestIdleCallback' in window && entries.length > 3000) {
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
    // Show view switching indicator for datasets that need it
    if (this.kvListItems.length > this.LARGE_DATASET_THRESHOLD) {
      this.isViewSwitching = true;
      this.cdRef.detectChanges();

      // Use a short delay to let the loading indicator appear
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.isListView = event.isListView;

            // Additional delay for detailed view to let cards render
            if (!this.isListView) {
              setTimeout(() => {
                if (this.kvListItems.length == 1) {
                  this.expandListItem(0);
                }
                this.isViewSwitching = false;
                this.cdRef.detectChanges();
              }, 200); // Give cards time to render
            } else {
              // Tabular view is faster
              setTimeout(() => {
                this.isViewSwitching = false;
                this.cdRef.detectChanges();
              }, 50);
            }
          });
        }, 100); // Let loading indicator show
      });
    } else {
      // Fast switching for smaller datasets
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.zone.run(() => {
            this.isListView = event.isListView;

            if (this.kvListItems.length == 1 && !this.isListView) {
              setTimeout(() => {
                this.expandListItem(0);
              }, 100);
            }
          });
        }, 0);
      });
    }
  }
}
