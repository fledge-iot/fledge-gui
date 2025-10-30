import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnInit, Output, ViewChild, SimpleChanges, OnChanges } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { filter, uniqWith, isEqual, cloneDeep } from 'lodash';
import { CustomValidator } from '../../../../directives/custom-validator';
import { ConfigurationControlService, RolesService, SharedService } from '../../../../services';
import { FileImportModalComponent } from '../../../common/file-import-modal/file-import-modal.component';
import { FileExportModalComponent } from '../../../common/file-export-modal/file-export-modal.component';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Subscription } from 'rxjs';
import { DelimiterStoreService } from '../../../../services/delimiter-store.service';
import { CsvJsonConverterService } from '../../../../services/csv-json-converter.service';

@Component({
  selector: 'app-list-type-configuration',
  templateUrl: './list-type-configuration.component.html',
  styleUrls: ['./list-type-configuration.component.css']
})
export class ListTypeConfigurationComponent implements OnInit, OnChanges {
  @Input() configuration;
  @Input() categoryName;
  @Input() group: string = '';
  @Input() from = '';
  @Input() fullConfiguration: any;
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
  isListDisabled = false;
  currentView: 'list' | 'detailed' | 'json' | 'csv' = 'list';
  jsonEditorData = '';
  csvEditorData = '';
  csvDelimiter: string = ',';
  editorErrorMessage = '';
  private viewChangeSub: Subscription;


  @ViewChild(CdkVirtualScrollViewport, { static: false }) viewport: CdkVirtualScrollViewport;
  private valueChangeSub: Subscription;

  constructor(
    private zone: NgZone,
    public cdRef: ChangeDetectorRef,
    public rolesService: RolesService,
    public configControlService: ConfigurationControlService,
    private fb: FormBuilder,
    private delimiterStoreService: DelimiterStoreService,
    private sharedService: SharedService,
    private csvJsonSvc: CsvJsonConverterService) {
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

    this.updateListValidity();

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
    this.viewChangeSub = this.sharedService.listKvView.subscribe((view) => {
      this.applyView(view as 'list' | 'detailed' | 'json' | 'csv');
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.fullConfiguration && this.fullConfiguration) {
      this.updateListValidity();
    }
  }

  get listItems() {
    return this.listItemsForm.get('listItems') as FormArray;
  }

  get listItemControls(): AbstractControl[] {
    return [...this.listItems.controls]; // returns a new reference
  }

  trackByIndex(index: number, item: AbstractControl): any {
    // Use the form control reference as the tracking key to prevent DOM reuse issues
    // This ensures each form control gets its own DOM element that won't be reused
    return item;
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
      } else if (this.currentView === 'detailed') {
        this.expandListItem(index);
      } else if (this.currentView === 'json') {
        this.jsonEditorData = this.csvJsonSvc.getJsonFromForm('list', this.configuration, this.listItems.value);
        const res = this.csvJsonSvc.parseJsonForList(this.jsonEditorData, this.configuration);
        if (res.error) {
          this.editorErrorMessage = res.error;
          return;
        }
      } else if (this.currentView === 'csv') {
        this.csvEditorData = this.csvJsonSvc.getCsvFromForm('list', this.configuration, this.listItems.value, this.csvDelimiter);
        const res = this.csvJsonSvc.parseCsvForList(this.csvEditorData, this.configuration);
        if (res.error) {
          this.editorErrorMessage = res.error;
          return;
        }
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

    // Force change detection to ensure proper DOM cleanup
    this.cdRef.detectChanges();
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
        // Update the configuration value for validity checking
        if (this.fullConfiguration && this.configuration.key) {
          this.fullConfiguration[this.configuration.key].value = JSON.stringify(processedValue);
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
    this.csvDelimiter = event.delimiter ?? ',';
    this.delimiterStoreService.setDelimiter(this.csvDelimiter);
    event.fileData.forEach(element => {
      this.initListItem(false, element);
    });
    if (this.currentView === 'json') {
      this.jsonEditorData = this.csvJsonSvc.getJsonFromForm('list', this.configuration, this.listItems.value);
    }
    if (this.currentView === 'csv') {
      this.csvEditorData = this.csvJsonSvc.getCsvFromForm('list', this.configuration, this.listItems.value, this.csvDelimiter);
    }
  }

  overrideFileData(event) {
    this.csvDelimiter = event.delimiter ?? ',';
    this.delimiterStoreService.setDelimiter(this.csvDelimiter);
    this.listItems.clear();
    this.initialProperties = [];
    event.fileData.forEach(element => {
      this.initListItem(false, element);
    });
    if (this.currentView === 'json') {
      this.jsonEditorData = this.csvJsonSvc.getJsonFromForm('list', this.configuration, this.listItems.value);
    }
    if (this.currentView === 'csv') {
      this.csvEditorData = this.csvJsonSvc.getCsvFromForm('list', this.configuration, this.listItems.value, this.csvDelimiter);
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
    this.applyView(event as 'list' | 'detailed' | 'json' | 'csv');
    this.sharedService.listKvView.next(this.currentView);
  }

  /**
   * Update the validity state of the list based on validity expressions
   */
  updateListValidity() {
    if (this.fullConfiguration && this.configuration.validity) {
      const tempConfig = { ...this.configuration, key: this.configuration.key };
      this.isListDisabled = !!this.configControlService.validateConfigItem(this.fullConfiguration, tempConfig);

      // Update form control states based on validity
      this.updateFormControlsState();
    } else {
      this.isListDisabled = false;
    }
  }

  /**
   * Update the enabled/disabled state of all form controls
   */
  updateFormControlsState() {
    if (this.listItemsForm && this.listItems) {
      const shouldDisable = this.isListDisabled || !this.rolesService.hasAccessPermission(this.configuration?.permissions);

      this.listItems.controls.forEach(control => {
        if (shouldDisable) {
          control.disable({ emitEvent: false });
        } else {
          control.enable({ emitEvent: false });
        }
      });
    }
  }

  private applyView(view: 'list' | 'detailed' | 'json' | 'csv') {
    this.currentView = view;
    this.editorErrorMessage = '';
    this.validConfigurationForm = true;
    if (this.currentView === 'json') {
      this.jsonEditorData = this.csvJsonSvc.getJsonFromForm('list', this.configuration, this.listItems.value);
    } else if (this.currentView === 'csv') {
      this.csvEditorData = this.csvJsonSvc.getCsvFromForm('list', this.configuration, this.listItems.value, this.csvDelimiter);
    }
    if (this.listItems.length == 1 && this.currentView === 'detailed') {
      this.expandListItem(0);
    }
  }

  public onDelimiterChanged(delimiter: string) {
    this.csvDelimiter = delimiter;
    this.delimiterStoreService.setDelimiter(delimiter);
    this.csvEditorData = this.csvJsonSvc.getCsvFromForm('list', this.configuration, this.listItems.value, this.csvDelimiter);
    this.cdRef.detectChanges();
    this.formStatusEvent.emit({ status: this.listItems.valid && this.validConfigurationForm, group: this.group });
  }

  // ===== Synchronization now handled by CsvJsonListKvService =====

  public onJsonEditorChange(text: string) {
    this.jsonEditorData = text;
    const res = this.csvJsonSvc.parseJsonForList(text, this.configuration);
    if (res.error) {
      this.setJsonError(res.error);
      return;
    }
    this.listItems.clear();
    this.initialProperties = [];
    this.items = [];
    (res.items || []).forEach(el => this.initListItem(false, el));
    this.clearJsonError();
  }

  // 🔹 Helper methods for readability
  private setJsonError(message: string) {
    this.editorErrorMessage = message;
    this.validConfigurationForm = false;
    this.formStatusEvent.emit({ status: false, group: this.group });
  }

  private clearJsonError() {
    this.editorErrorMessage = '';
    this.validConfigurationForm = true;
    this.cdRef.detectChanges();
    this.formStatusEvent.emit({
      status: this.listItems.valid && this.validConfigurationForm,
      group: this.group
    });
  }

  public onCsvEditorChange(text: string) {
    const res = this.csvJsonSvc.parseCsvForList(text ?? '', this.configuration);
    if (res.error) {
      this.setCsvError(res.error);
      return;
    }
    this.csvEditorData = text ?? '';
    this.csvDelimiter = res.delimiter ?? this.csvDelimiter ?? ',';
    this.listItems.clear();
    this.initialProperties = [];
    this.items = [];
    (res.items || []).forEach(el => this.initListItem(false, el));
    this.clearCsvError();
  }

  // 🔹 Helper methods for readability
  private setCsvError(message: string) {
    this.editorErrorMessage = message;
    this.validConfigurationForm = false;
    this.formStatusEvent.emit({ status: false, group: this.group });
  }

  private clearCsvError() {
    this.editorErrorMessage = '';
    this.validConfigurationForm = true;
    this.cdRef.detectChanges();
    this.formStatusEvent.emit({ status: this.listItems.valid && this.validConfigurationForm, group: this.group });
  }

  // Delimiter detection moved to CsvJsonListKvService

  ngOnDestroy() {
    this.valueChangeSub?.unsubscribe();
    this.viewChangeSub?.unsubscribe();
  }
}
