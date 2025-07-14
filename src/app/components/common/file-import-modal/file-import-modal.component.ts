import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
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

        try {
          const fileSizeInMB = files[0].size / (1024 * 1024);
          const isLargeFile = fileSizeInMB > 5; // Consider files > 5MB as large

          if (this.file.extension == 'csv') {
            // Use optimized methods for large files
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
                console.warn('CSV validation error:', error);
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

                // Generate limited table data for preview (first 50 rows only)
                const fileContent = await this.fileImportService.getTextFromFile(files);
                const dataRows = fileContent.split('\n').slice(0, 51); // Header + 50 rows
                this.tableData = dataRows;
              } catch (error) {
                console.warn('CSV import error:', error);
                this.file.isValid = false;
              }
            } else {
              // Use standard methods for smaller files
              try {
                this.file.isValid = await this.fileImportService.isCsvFileValid(files, this.configuration.properties, this.configuration.type, this.configuration.keyName);
              } catch (error) {
                console.warn('CSV validation error:', error);
                this.file.isValid = false;
              }

              try {
                this.tableData = await this.fileImportService.getTableData(files);
                this.file.data = await this.fileImportService.importCsvData(files, this.configuration.type);
              } catch (error) {
                console.warn('CSV import error:', error);
                this.file.isValid = false;
              }
            }
          } else {
            // JSON file processing
            if (isLargeFile) {
              // Use optimized JSON import for large files
              try {
                this.file.isValid = await this.fileImportService.isJsonFileValid(files, this.configuration.properties, this.configuration.type, this.configuration.keyName);
              } catch (error) {
                console.warn('JSON validation error:', error);
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

                // Generate limited table data for preview (first 50 entries only)
                const limitedData = Array.isArray(this.file.data) ?
                  this.file.data.slice(0, 50) :
                  Object.fromEntries(Object.entries(this.file.data).slice(0, 50));
                this.tableData = this.fileImportService.getJsonTableData(limitedData, this.configuration.type, this.configuration.keyName);
              } catch (error) {
                console.warn('JSON import error:', error);
                this.file.isValid = false;
              }
            } else {
              // Use standard methods for smaller files
              try {
                this.file.isValid = await this.fileImportService.isJsonFileValid(files, this.configuration.properties, this.configuration.type, this.configuration.keyName);
              } catch (error) {
                console.warn('JSON validation error:', error);
                this.file.isValid = false;
              }

              try {
                this.file.data = await this.fileImportService.importJsonData(files, this.configuration.type);
                this.tableData = this.fileImportService.getJsonTableData(this.file.data, this.configuration.type, this.configuration.keyName);
              } catch (error) {
                console.warn('JSON import error:', error);
                this.file.isValid = false;
              }
            }
          }
        } catch (error) {
          console.error('File processing error:', error);
          this.file.isValid = false;
        }

        // Ensure buttons remain enabled regardless of validation results
        this.file.isLoaded = true;
      }
    }
    this.ngProgress.done();
  }

  // Utility method for chunked processing delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      if (ms > 5 && 'requestIdleCallback' in window) {
        // Use requestIdleCallback for delays > 5ms for better performance
        requestIdleCallback(() => {
          if (ms > 5) {
            setTimeout(resolve, ms - 5); // Reduce overhead
          } else {
            resolve();
          }
        }, { timeout: ms + 20 }); // Reduced timeout
      } else {
        setTimeout(resolve, ms);
      }
    });
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
