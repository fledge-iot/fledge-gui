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
    this.ngProgress.start();
    if (files.length > 0) {
      this.file.isLoaded = false;
      this.tableData = null;
      this.file.name = this.fileImportService.getFileName(files);
      this.file.extension = this.fileImportService.getFileExtension(files).toLowerCase();
      this.file.isValidExtension = this.fileImportService.isExtensionValid(this.file.extension);

      if (this.file.isValidExtension) {
        // Enable buttons immediately for valid file extensions
        this.file.isLoaded = true;

        const fileSizeInMB = files[0].size / (1024 * 1024);
        const isLargeFile = fileSizeInMB > 1; // Reduced from 5MB to 1MB for more aggressive optimization

        // ALWAYS generate preview data first, regardless of validation
        try {
          if (this.file.extension == 'csv') {
            // Generate CSV preview
            const fileContent = await this.fileImportService.getTextFromFile(files);
            if (isLargeFile) {
              // For large files, show only first 50 rows
              const dataRows = fileContent.split('\n').slice(0, 51); // Header + 50 rows
              this.tableData = dataRows;
            } else {
              // For smaller files, show full table data
              this.tableData = await this.fileImportService.getTableData(files);
            }
          } else if (this.file.extension == 'json') {
            // Generate JSON preview - first parse the file to get preview data
            try {
              const jsonText = await this.fileImportService.getTextFromFile(files);
              const jsonObj = JSON.parse(jsonText);

              if (isLargeFile) {
                // For large files, show only first 50 entries
                const limitedData = Array.isArray(jsonObj) ?
                  jsonObj.slice(0, 50) :
                  Object.fromEntries(Object.entries(jsonObj).slice(0, 50));
                this.tableData = this.fileImportService.getJsonTableData(limitedData, this.configuration.type, this.configuration.keyName);
              } else {
                // For smaller files, show full data
                this.tableData = this.fileImportService.getJsonTableData(jsonObj, this.configuration.type, this.configuration.keyName);
              }
            } catch (jsonError) {
              // Even if JSON is invalid, we can still show something
              this.tableData = ['Invalid JSON format'];
            }
          }

          // Trigger change detection immediately after setting tableData
          this.cdr.detectChanges();
        } catch (previewError) {
          this.tableData = ['Error generating preview'];
          // Trigger change detection even for errors
          this.cdr.detectChanges();
        }

        // Now handle validation and data import separately
        try {
          if (this.file.extension == 'csv') {
            // CSV validation and import
            if (isLargeFile) {
              // Use optimized validation with sampling for large files
              try {
                this.file.isValid = await this.fileImportService.isCsvFileValidOptimized(
                  files,
                  this.configuration.properties,
                  this.configuration.type,
                  this.configuration.keyName,
                  1000 // Sample only 1000 rows for validation
                );
              } catch (error) {
                this.file.isValid = false;
              }

              // Use chunked import for large files
              try {
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

                this.file.data = await this.fileImportService.importCsvDataChunked(
                  files,
                  this.configuration.type,
                  chunkSize,
                  (progress) => {
                    // Update progress bar
                    this.ngProgress.set(progress);
                  },
                  delayMs // Add delay parameter
                );
              } catch (error) {
                this.file.isValid = false;
              }
            } else {
              // Use standard methods for smaller files
              try {
                this.file.isValid = await this.fileImportService.isCsvFileValid(files, this.configuration.properties, this.configuration.type, this.configuration.keyName);
              } catch (error) {
                this.file.isValid = false;
              }

              try {
                this.file.data = await this.fileImportService.importCsvData(files, this.configuration.type);
              } catch (error) {
                this.file.isValid = false;
              }
            }
          } else if (this.file.extension == 'json') {
            // JSON validation and import
            if (isLargeFile) {
              // Use optimized JSON import for large files
              try {
                this.file.isValid = await this.fileImportService.isJsonFileValid(files, this.configuration.properties, this.configuration.type, this.configuration.keyName);
              } catch (error) {
                this.file.isValid = false;
              }

              try {
                // Optimized chunking for better performance vs crash prevention balance
                const estimatedEntries = files[0].size / 150; // Rough estimate for JSON
                let delayMs = 0; // No delay for most cases

                if (estimatedEntries > 15000) {
                  delayMs = 10;    // Minimal delay for very large files
                } else if (estimatedEntries > 8000) {
                  delayMs = 5;     // Very small delay for large files
                }

                this.file.data = await this.fileImportService.importJsonDataOptimized(
                  files,
                  this.configuration.type,
                  (progress) => {
                    // Update progress bar
                    this.ngProgress.set(progress);
                  },
                  delayMs // Add delay parameter
                );
              } catch (error) {
                this.file.isValid = false;
              }
            } else {
              // Use standard methods for smaller files
              try {
                this.file.isValid = await this.fileImportService.isJsonFileValid(files, this.configuration.properties, this.configuration.type, this.configuration.keyName);
              } catch (error) {
                this.file.isValid = false;
              }

              try {
                this.file.data = await this.fileImportService.importJsonData(files, this.configuration.type);
              } catch (error) {
                this.file.isValid = false;
              }
            }
          }
        } catch (error) {
          this.file.isValid = false;
        }

        // Ensure buttons remain enabled regardless of validation results
        this.file.isLoaded = true;
      }
    }
    this.ngProgress.done();

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
