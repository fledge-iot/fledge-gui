import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FileImportService } from '../../../services/file-import.service';
import { ProgressBarService } from '../../../services';

export interface FileData {
  name: string;
  extension: string;
  isLoaded: boolean;
  data: any;
  isValid: boolean;
  isValidExtension: boolean;
}

@Component({
  selector: 'app-file-import-modal',
  templateUrl: './file-import-modal.component.html',
  styleUrls: ['./file-import-modal.component.css']
})
export class FileImportModalComponent {

  @Input() configuration;
  @Output() appendFile = new EventEmitter<any>();
  @Output() overrideFile = new EventEmitter<any>();

  tableData;
  file: FileData = { name: '', extension: '', isLoaded: false, data: null, isValid: true, isValidExtension: true };

  @ViewChild('fileImport', { static: true }) fileImport: ElementRef;
  constructor(public fileImportService: FileImportService,
    public ngProgress: ProgressBarService,
    private cdr: ChangeDetectorRef
  ) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.formReset();
  }

  ngOnInit() { }

  public toggleModal(isOpen: boolean) {
    const modalName = <HTMLDivElement>document.getElementById('file-import-modal-' + this.configuration.key);
    if (isOpen) {
      modalName.classList.add('is-active');
      return;
    }
    modalName.classList.remove('is-active');
  }

  formReset() {
    this.toggleModal(false);
    this.tableData = null;
    this.file = { name: '', extension: '', isLoaded: false, data: null, isValid: true, isValidExtension: true };
    this.fileImport.nativeElement.value = '';

    // Trigger change detection to ensure UI updates immediately
    this.cdr.detectChanges();
  }

  appendFileData() {
    this.appendFile.emit({ fileData: this.file.data });
    this.formReset();
  }

  overrideFileData() {
    this.overrideFile.emit({ fileData: this.file.data });
    this.formReset();
  }

  async loadFile(files: File[]) {
    const importStartTime = performance.now();
    const fileSize = files[0].size;
    const fileSizeInMB = fileSize / (1024 * 1024);

    this.ngProgress.start();
    if (files.length > 0) {
      this.file.isLoaded = false;
      this.tableData = null;
      this.file.name = this.fileImportService.getFileName(files);
      this.file.extension = this.fileImportService.getFileExtension(files).toLowerCase();
      this.file.isValidExtension = this.fileImportService.isExtensionValid(this.file.extension);

      console.log(`🚀 IMPORT START: File=${this.file.name}.${this.file.extension}, Size=${fileSizeInMB.toFixed(2)}MB, ConfigType=${this.configuration.type}`);

      if (this.file.isValidExtension) {
        // Enable buttons immediately for valid file extensions
        this.file.isLoaded = true;

        const isLargeFile = fileSizeInMB > 1; // Reduced from 5MB to 1MB for more aggressive optimization

        // ALWAYS generate preview data first, regardless of validation
        try {
          const previewStartTime = performance.now();
          console.log(`👀 PREVIEW GENERATION START: ${this.file.extension.toUpperCase()} file, Size=${fileSizeInMB.toFixed(2)}MB`);

          if (this.file.extension == 'csv') {
            // Generate CSV preview - always show full table data
            this.tableData = await this.fileImportService.getTableData(files);
            console.log(`📋 CSV Preview: Showing all ${this.tableData ? this.tableData.length : 0} rows`);
          } else if (this.file.extension == 'json') {
            // Generate JSON preview - always show full data
            try {
              const jsonText = await this.fileImportService.getTextFromFile(files);
              const jsonObj = JSON.parse(jsonText);

              this.tableData = this.fileImportService.getJsonTableData(jsonObj, this.configuration.type, this.configuration.keyName);
              const totalEntries = Array.isArray(jsonObj) ? jsonObj.length : Object.keys(jsonObj).length;
              console.log(`📋 JSON Preview: Showing all ${totalEntries} entries`);
            } catch (jsonError) {
              // Even if JSON is invalid, we can still show something
              this.tableData = ['Invalid JSON format'];
              console.log(`❌ JSON Preview Error: Invalid JSON format`);
            }
          }

          const previewEndTime = performance.now();
          console.log(`✅ PREVIEW GENERATION COMPLETE: ${previewEndTime - previewStartTime}ms for ${this.file.extension.toUpperCase()}`);

          // Trigger change detection immediately after setting tableData
          this.cdr.detectChanges();
        } catch (previewError) {
          this.tableData = ['Error generating preview'];
          console.log(`❌ Preview Generation Error: ${previewError.message}`);
          // Trigger change detection even for errors
          this.cdr.detectChanges();
        }

        // Now handle validation and data import separately
        try {
          const processingStartTime = performance.now();
          console.log(`🔍 DATA PROCESSING START: ${this.file.extension.toUpperCase()} validation and import`);

          if (this.file.extension == 'csv') {
            // CSV validation and import
            if (isLargeFile) {
              console.log(`⚡ Using optimized CSV processing for large file`);
              // Use optimized validation with sampling for large files
              try {
                const validationStartTime = performance.now();
                this.file.isValid = await this.fileImportService.isCsvFileValidOptimized(
                  files,
                  this.configuration.properties,
                  this.configuration.type,
                  this.configuration.keyName,
                  1000 // Sample only 1000 rows for validation
                );
                const validationEndTime = performance.now();
                console.log(`✅ CSV Validation Complete: ${validationEndTime - validationStartTime}ms (sampled 1000 rows), Valid=${this.file.isValid}`);
              } catch (error) {
                this.file.isValid = false;
                console.log(`❌ CSV Validation Error: ${error.message}`);
              }

              // Use chunked import for large files
              try {
                const importDataStartTime = performance.now();
                // Optimized chunking for better performance vs crash prevention balance
                const estimatedRows = files[0].size / 100; // Rough estimate
                let chunkSize = 200; // Increased default chunk size
                let delayMs = 0;     // No delay for most cases

                if (estimatedRows > 15000) {
                  chunkSize = 50;  // Medium chunks for very large files
                  delayMs = 10;    // Minimal delay
                } else if (estimatedRows > 8000) {
                  chunkSize = 100; // Larger chunks for large files
                  delayMs = 5;     // Very small delay
                }

                console.log(`📊 CSV Chunked Import: Estimated ${Math.round(estimatedRows)} rows, ChunkSize=${chunkSize}, Delay=${delayMs}ms`);

                this.file.data = await this.fileImportService.importCsvDataChunked(
                  files,
                  this.configuration.type,
                  chunkSize,
                  (progress) => {
                    // Update progress bar
                    this.ngProgress.set(progress);
                    if (progress % 20 === 0) { // Log every 20% progress
                      console.log(`📈 CSV Import Progress: ${progress}%`);
                    }
                  },
                  delayMs // Add delay parameter
                );

                const importDataEndTime = performance.now();
                const actualRows = Array.isArray(this.file.data) ? this.file.data.length : Object.keys(this.file.data || {}).length;
                console.log(`✅ CSV Chunked Import Complete: ${importDataEndTime - importDataStartTime}ms for ${actualRows} rows`);
              } catch (error) {
                this.file.isValid = false;
                console.log(`❌ CSV Chunked Import Error: ${error.message}`);
              }
            } else {
              console.log(`🏃 Using standard CSV processing for small file`);
              // Use standard methods for smaller files
              try {
                const validationStartTime = performance.now();
                this.file.isValid = await this.fileImportService.isCsvFileValid(files, this.configuration.properties, this.configuration.type, this.configuration.keyName);
                const validationEndTime = performance.now();
                console.log(`✅ CSV Validation Complete: ${validationEndTime - validationStartTime}ms, Valid=${this.file.isValid}`);
              } catch (error) {
                this.file.isValid = false;
                console.log(`❌ CSV Validation Error: ${error.message}`);
              }

              try {
                const importDataStartTime = performance.now();
                this.file.data = await this.fileImportService.importCsvData(files, this.configuration.type);
                const importDataEndTime = performance.now();
                const actualRows = Array.isArray(this.file.data) ? this.file.data.length : Object.keys(this.file.data || {}).length;
                console.log(`✅ CSV Standard Import Complete: ${importDataEndTime - importDataStartTime}ms for ${actualRows} rows`);
              } catch (error) {
                this.file.isValid = false;
                console.log(`❌ CSV Standard Import Error: ${error.message}`);
              }
            }
          } else if (this.file.extension == 'json') {
            // JSON validation and import
            if (isLargeFile) {
              console.log(`⚡ Using optimized JSON processing for large file`);
              // Use optimized JSON import for large files
              try {
                const validationStartTime = performance.now();
                this.file.isValid = await this.fileImportService.isJsonFileValid(files, this.configuration.properties, this.configuration.type, this.configuration.keyName);
                const validationEndTime = performance.now();
                console.log(`✅ JSON Validation Complete: ${validationEndTime - validationStartTime}ms, Valid=${this.file.isValid}`);
              } catch (error) {
                this.file.isValid = false;
                console.log(`❌ JSON Validation Error: ${error.message}`);
              }

              try {
                const importDataStartTime = performance.now();
                // Optimized chunking for better performance vs crash prevention balance
                const estimatedEntries = files[0].size / 150; // Rough estimate for JSON
                let delayMs = 0; // No delay for most cases

                if (estimatedEntries > 15000) {
                  delayMs = 10;    // Minimal delay for very large files
                } else if (estimatedEntries > 8000) {
                  delayMs = 5;     // Very small delay for large files
                }

                console.log(`📊 JSON Optimized Import: Estimated ${Math.round(estimatedEntries)} entries, Delay=${delayMs}ms`);

                this.file.data = await this.fileImportService.importJsonDataOptimized(
                  files,
                  this.configuration.type,
                  (progress) => {
                    // Update progress bar
                    this.ngProgress.set(progress);
                    if (progress % 20 === 0) { // Log every 20% progress
                      console.log(`📈 JSON Import Progress: ${progress}%`);
                    }
                  },
                  delayMs // Add delay parameter
                );

                const importDataEndTime = performance.now();
                const actualEntries = Array.isArray(this.file.data) ? this.file.data.length : Object.keys(this.file.data || {}).length;
                console.log(`✅ JSON Optimized Import Complete: ${importDataEndTime - importDataStartTime}ms for ${actualEntries} entries`);
              } catch (error) {
                this.file.isValid = false;
                console.log(`❌ JSON Optimized Import Error: ${error.message}`);
              }
            } else {
              console.log(`🏃 Using standard JSON processing for small file`);
              // Use standard methods for smaller files
              try {
                const validationStartTime = performance.now();
                this.file.isValid = await this.fileImportService.isJsonFileValid(files, this.configuration.properties, this.configuration.type, this.configuration.keyName);
                const validationEndTime = performance.now();
                console.log(`✅ JSON Validation Complete: ${validationEndTime - validationStartTime}ms, Valid=${this.file.isValid}`);
              } catch (error) {
                this.file.isValid = false;
                console.log(`❌ JSON Validation Error: ${error.message}`);
              }

              try {
                const importDataStartTime = performance.now();
                this.file.data = await this.fileImportService.importJsonData(files, this.configuration.type);
                const importDataEndTime = performance.now();
                const actualEntries = Array.isArray(this.file.data) ? this.file.data.length : Object.keys(this.file.data || {}).length;
                console.log(`✅ JSON Standard Import Complete: ${importDataEndTime - importDataStartTime}ms for ${actualEntries} entries`);
              } catch (error) {
                this.file.isValid = false;
                console.log(`❌ JSON Standard Import Error: ${error.message}`);
              }
            }
          }

          const processingEndTime = performance.now();
          console.log(`✅ DATA PROCESSING COMPLETE: ${processingEndTime - processingStartTime}ms for ${this.file.extension.toUpperCase()}`);
        } catch (error) {
          this.file.isValid = false;
          console.log(`❌ Data Processing Error: ${error.message}`);
        }

        // Ensure buttons remain enabled regardless of validation results
        this.file.isLoaded = true;
      }
    }
    this.ngProgress.done();

    const importEndTime = performance.now();
    const totalImportTime = importEndTime - importStartTime;
    console.log(`🎉 TOTAL IMPORT TIME: ${totalImportTime}ms - File=${this.file.name}.${this.file.extension}, Size=${fileSizeInMB.toFixed(2)}MB, Valid=${this.file.isValid}, ConfigType=${this.configuration.type}`);

    // Final change detection to ensure all UI updates are applied
    this.cdr.detectChanges();
  }

  onFileChange(event: any) {
    this.loadFile(event.target.files);
  }

  // File drag
  onDragOver(event: any) {
    event.preventDefault();
  }

  // File drop success
  onDropSuccess(event: any) {
    event.preventDefault();
    this.loadFile(event.dataTransfer.files);
  }
}
