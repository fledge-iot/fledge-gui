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
  
  // Manual paste mode properties
  isManualMode = false;
  manualContent = '';
  detectedFormat = '';
  codeMirrorOptions: any = {};
  
  // Loading state
  isLoading = false;

  @ViewChild('fileImport', { static: true }) fileImport: ElementRef;
  constructor(public fileImportService: FileImportService,
    public ngProgress: ProgressBarService,
  ) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.formReset();
  }

  ngOnInit() {
    this.initializeCodeMirror();
  }

  private initializeCodeMirror() {
    this.codeMirrorOptions = {
      lineNumbers: true,
      lineWrapping: true,
      foldGutter: true,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
      autoCloseBrackets: true,
      matchBrackets: true,
      lint: true,
      inputStyle: 'textarea',
      autoRefresh: true,
      mode: 'text/plain',
      placeholder: 'Paste CSV or JSON content here...',
      viewportMargin: Infinity,
      height: '300px'
    };
  }

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
    if (this.fileImport && this.fileImport.nativeElement) {
      this.fileImport.nativeElement.value = '';
    }
    this.isManualMode = false;
    this.manualContent = '';
    this.detectedFormat = '';
    this.isLoading = false;
    this.updateCodeMirrorMode('text/plain');
  }

  toggleManualMode() {
    this.isManualMode = !this.isManualMode;
    if (this.isManualMode) {
      this.manualContent = '';
      this.detectedFormat = '';
      this.updateCodeMirrorMode('text/plain');
    } else {
      // Reset to file upload mode without closing modal
      this.manualContent = '';
      this.detectedFormat = '';
      this.file = { name: '', extension: '', isLoaded: false, data: null, isValid: true, isValidExtension: true };
      this.tableData = null;
      if (this.fileImport && this.fileImport.nativeElement) {
        this.fileImport.nativeElement.value = '';
      }
    }
  }

  onManualContentChange(content: string) {
    this.manualContent = content;
    this.detectContentFormat(content);
    this.processManualContent();
  }

  private detectContentFormat(content: string): void {
    if (!content.trim()) {
      this.detectedFormat = '';
      this.updateCodeMirrorMode('text/plain');
      return;
    }

    // Try to detect JSON first
    try {
      JSON.parse(content);
      this.detectedFormat = 'JSON';
      this.updateCodeMirrorMode('application/json');
      return;
    } catch (e) {
      // Not JSON, continue to CSV detection
    }

    // Detect CSV format
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length >= 2) {
      const firstLine = lines[0];
      const secondLine = lines[1];
      
      // Check if first line has commas and second line has similar structure
      if (firstLine.includes(',') && secondLine.includes(',')) {
        const firstLineCommas = (firstLine.match(/,/g) || []).length;
        const secondLineCommas = (secondLine.match(/,/g) || []).length;
        
        if (firstLineCommas === secondLineCommas && firstLineCommas > 0) {
          this.detectedFormat = 'CSV';
          this.updateCodeMirrorMode('text/csv');
          return;
        }
      }
    }

    // Default to plain text
    this.detectedFormat = 'Unknown';
    this.updateCodeMirrorMode('text/plain');
  }

  private updateCodeMirrorMode(mode: string): void {
    this.codeMirrorOptions = { ...this.codeMirrorOptions, mode };
  }

  private async processManualContent(): Promise<void> {
    if (!this.manualContent.trim() || !this.detectedFormat) {
      this.file.isLoaded = false;
      this.tableData = null;
      return;
    }

    this.isLoading = true;
    this.ngProgress.start();
    this.file.isLoaded = false;
    this.tableData = null;

    try {
      if (this.detectedFormat === 'JSON') {
        await this.processManualJson();
      } else if (this.detectedFormat === 'CSV') {
        await this.processManualCsv();
      }
    } catch (error) {
      console.error('Error processing manual content:', error);
      this.file.isValid = false;
    }

    this.ngProgress.done();
    this.isLoading = false;
  }

  private async processManualJson(): Promise<void> {
    try {
      // Preprocess content to match file import behavior (remove trailing newline)
      let processedContent = this.manualContent;
      if (processedContent.slice(-1) === '\n') {
        processedContent = processedContent.slice(0, -1);
      }
      
      const jsonData = JSON.parse(processedContent);
      this.file.extension = 'json';
      this.file.isValidExtension = true;
      
      // Validate JSON structure
      this.file.isValid = await this.validateJsonStructure(jsonData);
      
      if (this.file.isValid) {
        this.file.data = jsonData;
        this.tableData = this.fileImportService.getJsonTableData(jsonData, this.configuration.type, this.configuration.keyName);
        this.file.isLoaded = true;
        console.log('Manual JSON - file.data:', this.file.data);
        console.log('Manual JSON - tableData:', this.tableData);
      }
    } catch (error) {
      this.file.isValid = false;
    }
  }

  private async processManualCsv(): Promise<void> {
    try {
      // Create a temporary file-like object for validation
      const tempFile = new File([this.manualContent], 'temp.csv', { type: 'text/csv' });
      
      this.file.extension = 'csv';
      this.file.isValidExtension = true;
      
      // Validate CSV structure
      this.file.isValid = await this.fileImportService.isCsvFileValid([tempFile], this.configuration.properties, this.configuration.type, this.configuration.keyName);
      
      if (this.file.isValid) {
        // Preprocess content to match file import behavior (remove trailing newline)
        let processedContent = this.manualContent;
        if (processedContent.slice(-1) === '\n') {
          processedContent = processedContent.slice(0, -1);
        }
        
        this.file.data = this.fileImportService.importDataFromCSV(processedContent, this.configuration.type);
        this.tableData = processedContent.split('\n').filter(line => line.trim());
        this.file.isLoaded = true;
        console.log('Manual CSV - file.data:', this.file.data);
        console.log('Manual CSV - tableData:', this.tableData);
      }
    } catch (error) {
      this.file.isValid = false;
    }
  }

  private async validateJsonStructure(jsonData: any): Promise<boolean> {
    // Create a temporary file-like object for validation
    const tempFile = new File([this.manualContent], 'temp.json', { type: 'application/json' });
    return await this.fileImportService.isJsonFileValid([tempFile], this.configuration.properties, this.configuration.type, this.configuration.keyName);
  }

  appendFileData() {
    console.log('appendFileData - file.data:', this.file.data);
    console.log('appendFileData - file.data type:', typeof this.file.data);
    console.log('appendFileData - file.data length:', Array.isArray(this.file.data) ? this.file.data.length : 'not array');
    console.log('appendFileData - emitting event with data:', { fileData: this.file.data });
    this.appendFile.emit({ fileData: this.file.data });
    console.log('appendFileData - event emitted, about to reset form');
    this.formReset();
  }

  overrideFileData() {
    console.log('overrideFileData - file.data:', this.file.data);
    console.log('overrideFileData - file.data type:', typeof this.file.data);
    console.log('overrideFileData - file.data length:', Array.isArray(this.file.data) ? this.file.data.length : 'not array');
    console.log('overrideFileData - emitting event with data:', { fileData: this.file.data });
    this.overrideFile.emit({ fileData: this.file.data });
    console.log('overrideFileData - event emitted, about to reset form');
    this.formReset();
  }

  async loadFile(files: File[]) {
    this.isLoading = true;
    this.ngProgress.start();
    if (files.length > 0) {
      this.file.isLoaded = false;
      this.tableData = null;
      this.file.name = this.fileImportService.getFileName(files);
      this.file.extension = this.fileImportService.getFileExtension(files).toLowerCase();
      this.file.isValidExtension = this.fileImportService.isExtensionValid(this.file.extension);
      if (this.file.isValidExtension) {
        if (this.file.extension == 'csv') {
          this.file.isValid = await this.fileImportService.isCsvFileValid(files, this.configuration.properties, this.configuration.type, this.configuration.keyName);
          if (this.file.isValid) {
            this.tableData = await this.fileImportService.getTableData(files);
            this.file.data = await this.fileImportService.importCsvData(files, this.configuration.type);
            this.file.isLoaded = true;
            console.log('File CSV - file.data:', this.file.data);
            console.log('File CSV - tableData:', this.tableData);
          }
        }
        else {
          this.file.isValid = await this.fileImportService.isJsonFileValid(files, this.configuration.properties, this.configuration.type, this.configuration.keyName);
          if (this.file.isValid) {
            this.file.data = await this.fileImportService.importJsonData(files, this.configuration.type);
            this.tableData = this.fileImportService.getJsonTableData(this.file.data, this.configuration.type, this.configuration.keyName);
            this.file.isLoaded = true;
            console.log('File JSON - file.data:', this.file.data);
            console.log('File JSON - tableData:', this.tableData);
          }
        }
      }
    }
    this.ngProgress.done();
    this.isLoading = false;
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
