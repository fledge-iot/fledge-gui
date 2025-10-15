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
  delimiter?: string;
}

export interface CodeMirrorOptions {
  lineNumbers: boolean;
  lineWrapping: boolean;
  foldGutter: boolean;
  gutters: string[];
  autoCloseBrackets: boolean;
  matchBrackets: boolean;
  lint: boolean;
  inputStyle: string;
  autoRefresh: boolean;
  mode: string;
  placeholder: string;
  viewportMargin: number;
  height: string;
}

export interface Configuration {
  key: string;
  type: string;
  keyName: string;
  properties: any;
}

@Component({
  selector: 'app-file-import-modal',
  templateUrl: './file-import-modal.component.html',
  styleUrls: ['./file-import-modal.component.css']
})
export class FileImportModalComponent {
  private static readonly CODEMIRROR_HEIGHT = '300px';
  private static readonly SUPPORTED_EXTENSIONS = ['csv', 'json'];
  private static readonly DEFAULT_FILE_DATA: FileData = {
    name: '',
    extension: '',
    isLoaded: false,
    data: null,
    isValid: true,
    isValidExtension: true
  };

  @Input() configuration: Configuration;
  @Output() appendFile = new EventEmitter<{ fileData: any, delimiter: string }>();
  @Output() overrideFile = new EventEmitter<{ fileData: any, delimiter: string }>();

  tableData: string[] | null = null;
  file: FileData = { ...FileImportModalComponent.DEFAULT_FILE_DATA };

  // Manual paste mode properties
  isManualMode = false;
  manualContent = '';
  detectedFormat = '';
  codeMirrorOptions: CodeMirrorOptions = {} as CodeMirrorOptions;

  // Loading state
  isLoading = false;

  // Error state
  validationError = '';

  // Delimiter selection
  selectedDelimiter = ',';
  delimiterOptions = [
    { value: ',', label: 'Comma (,)', symbol: ',' },
    { value: ';', label: 'Semicolon (;)', symbol: ';' },
    { value: '\t', label: 'Tab', symbol: 'Tab' },
    { value: '|', label: 'Pipe (|)', symbol: '|' },
    { value: ':', label: 'Colon (:)', symbol: ':' }
  ];

  @ViewChild('fileImport', { static: true }) fileImport: ElementRef;
  constructor(
    public fileImportService: FileImportService,
    public ngProgress: ProgressBarService
  ) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.formReset();
  }

  ngOnInit(): void {
    this.initializeCodeMirror();
  }

  /**
   * Initializes CodeMirror editor with default configuration
   * @private
   */
  private initializeCodeMirror(): void {
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
      height: FileImportModalComponent.CODEMIRROR_HEIGHT
    };
  }

  /**
   * Toggles the modal visibility
   * @param isOpen - Whether to open or close the modal
   * @public
   */
  public toggleModal(isOpen: boolean): void {
    const modalName = <HTMLDivElement>document.getElementById('file-import-modal-' + this.configuration.key);
    if (isOpen) {
      modalName.classList.add('is-active');
      return;
    }
    modalName.classList.remove('is-active');
  }

  /**
   * Resets the form and closes the modal
   * @public
   */
  formReset(): void {
    this.toggleModal(false);
    this.resetFileData();
  }

  /**
   * Resets all file data and form state
   * @private
   */
  private resetFileData(): void {
    this.tableData = null;
    this.file = { ...FileImportModalComponent.DEFAULT_FILE_DATA };
    this.isManualMode = false;
    this.manualContent = '';
    this.detectedFormat = '';
    this.isLoading = false;
    this.validationError = '';
    this.selectedDelimiter = ',';
    this.updateCodeMirrorMode('text/plain');

    if (this.fileImport?.nativeElement) {
      this.fileImport.nativeElement.value = '';
    }
  }

  /**
   * Toggles between manual paste mode and file upload mode
   * @public
   */
  toggleManualMode(): void {
    this.isManualMode = !this.isManualMode;
    this.manualContent = '';
    this.detectedFormat = '';
    this.validationError = '';
    this.selectedDelimiter = ',';
    this.updateCodeMirrorMode('text/plain');

    if (!this.isManualMode && this.fileImport?.nativeElement) {
      this.fileImport.nativeElement.value = '';
    }
  }

  /**
   * Handles manual content changes and triggers processing
   * @param content - The new content from CodeMirror
   * @public
   */
  onManualContentChange(content: string): void {
    this.manualContent = content;
    this.validationError = ''; // Clear previous errors
    this.detectContentFormat(content);
    this.processManualContent();
  }

  /**
   * Handles delimiter selection changes
   * @param delimiter - The selected delimiter
   * @public
   */
  onDelimiterChange(delimiter: string): void {
    if (this.detectedFormat === 'CSV' && this.manualContent.trim()) {
      // Replace old delimiter in editor content
      if (this.selectedDelimiter && this.selectedDelimiter !== delimiter) {
        const oldDelimiter = this.selectedDelimiter;
        const regex = new RegExp(this.escapeRegExp(oldDelimiter), 'g');
        this.manualContent = this.manualContent.replace(regex, delimiter);
      }
    }

    this.selectedDelimiter = delimiter;
    this.validationError = ''; // Clear previous errors

    // Re-process content with new delimiter if it's CSV
    if (this.detectedFormat === 'CSV' && this.manualContent.trim()) {
      this.detectContentFormat(this.manualContent);
      this.processManualContent();
    }
  }

  /**
   * Detects the format (JSON/CSV) of the manually pasted content
   * @param content - The content to analyze
   * @private
   */
  private detectContentFormat(content: string): void {
    if (!content.trim()) {
      this.detectedFormat = '';
      this.validationError = '';
      this.updateCodeMirrorMode('text/plain');
      return;
    }

    // JSON detection
    try {
      JSON.parse(content);
      this.detectedFormat = 'JSON';
      this.validationError = '';
      this.updateCodeMirrorMode('application/json');
      return;
    } catch (e) {
      // Store JSON parsing error for later use
      this.validationError = this.getJsonErrorMessage(e);
      // Not JSON, continue to CSV detection
    }

    // CSV detection
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length >= 2) {
      const firstLine = lines[0];
      const secondLine = lines[1];

      // check which delimiter produces consistent columns
      let detected: string | null = null;
      for (const opt of this.delimiterOptions) {
        const delim = opt.value;
        const firstCols = firstLine.split(delim).length;
        const secondCols = secondLine.split(delim).length;

        if (firstCols > 1 && firstCols === secondCols) {
          detected = delim;
          break;
        }
      }

      if (!detected) {
        this.detectedFormat = 'CSV';
        this.validationError = 'Invalid CSV format. Could not detect a consistent delimiter.';
        this.updateCodeMirrorMode('text/csv');
        return;
      }

      this.selectedDelimiter = detected;
      this.detectedFormat = 'CSV';
      this.validationError = '';
      this.updateCodeMirrorMode('text/csv');
      return;
    }

    this.detectedFormat = 'Unknown';
    this.updateCodeMirrorMode('text/plain');
  }

  /**
   * Extracts a user-friendly error message from JSON parsing errors
   * @param error - The JSON parsing error
   * @returns User-friendly error message
   * @private
   */
  private getJsonErrorMessage(error: any): string {
    return 'Invalid JSON format.';
  }

  /**
   * Extracts a user-friendly error message from CSV processing errors
   * @param error - The CSV processing error
   * @returns User-friendly error message
   * @private
   */
  private getCsvErrorMessage(error: any): string {
    return 'Invalid CSV format. Use comma or tab as delimiter.';
  }

  /**
   * Escapes special regex characters in delimiter for use in RegExp
   * @param delimiter - The delimiter to escape
   * @returns Escaped delimiter string
   * @private
   */
  private escapeRegExp(delimiter: string): string {
    return delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Gets the display name for the current delimiter
   * @returns Display name for the delimiter
   * @public
   */
  getDelimiterDisplayName(): string {
    const option = this.delimiterOptions.find(opt => opt.value === this.selectedDelimiter);
    return option ? option.symbol : this.selectedDelimiter;
  }

  /**
   * Updates the CodeMirror editor mode based on detected content format
   * @param mode - The mode to set (text/plain, application/json, text/csv)
   * @private
   */
  private updateCodeMirrorMode(mode: string): void {
    this.codeMirrorOptions = { ...this.codeMirrorOptions, mode };
  }

  private getListConfigurationType(): 'list' | 'kvlist' {
    return this.configuration?.type === 'kvlist' ? 'kvlist' : 'list';
  }

  /**
   * Processes manually pasted content and validates it
   * @private
   */
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
      this.handleProcessingError(error);
    } finally {
      this.ngProgress.done();
      this.isLoading = false;
    }
  }

  /**
   * Handles processing errors and resets file state
   * @param error - The error that occurred
   * @private
   */
  private handleProcessingError(error: any): void {
    this.file.isValid = false;
    this.file.isLoaded = false;
    this.tableData = null;
    this.validationError = error.message || 'Processing error occurred';
  }

  /**
   * Processes manually pasted JSON content
   * @private
   */
  private async processManualJson(): Promise<void> {
    try {
      // Preprocess content to match file import behavior (remove trailing newline)
      const processedContent = this.removeTrailingNewline(this.manualContent);
      const jsonData = JSON.parse(processedContent);
      this.file.extension = 'json';
      this.file.isValidExtension = true;

      // Validate JSON structure
      this.file.isValid = await this.validateJsonStructure(jsonData);

      if (this.file.isValid) {
        this.file.data = jsonData;
        this.tableData = this.fileImportService.getJsonTableData(
          jsonData,
          this.getListConfigurationType(),
          this.configuration.keyName
        );
        this.file.isLoaded = true;
      }
    } catch {
      this.file.isValid = false;
      this.file.isLoaded = false;
      this.validationError = 'Invalid JSON format.';
      throw new Error('Invalid JSON format.');
    }
  }

  /**
   * Processes manually pasted CSV content
   * @private
   */
  private async processManualCsv(): Promise<void> {
    try {
      // Determine delimiter strictly as comma or tab
      const text = this.removeTrailingNewline(this.manualContent);
      const normalized = this.normalizeLineEndings(text);
      const lines = normalized.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        this.file.isValid = false;
        this.file.isLoaded = false;
        this.validationError = 'Invalid CSV format. Use comma or tab as delimiter.';
        throw new Error('Invalid CSV format.');
      }
      const header = lines[0];
      const delimiter = this.selectedDelimiter || ','; // use selected delimiter

      const headerCols = header.split(delimiter).length;
      if (headerCols < 2) {
        throw new Error(`Invalid CSV format. Header is not delimited with "${delimiter}".`);
      }

      // Validate all rows have the same number of columns
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].split(delimiter).length !== headerCols) {
          this.file.isValid = false;
          this.file.isLoaded = false;
          this.validationError = delimiter === '\t' ? 'Invalid tab-delimited CSV format.' : 'Invalid CSV format. Use comma or tab as delimiter.';
          throw new Error('Invalid CSV format.');
        }
      }

      this.file.extension = 'csv';
      this.file.isValidExtension = true;
      this.file.isValid = true;
      this.file.data = this.importDataFromCSVWithDelimiter(normalized, this.configuration.type, delimiter);

      // Keep tableData raw but split using the chosen delimiter
      this.tableData = normalized.split('\n').filter(line => line.trim());
      this.file.isLoaded = true;

    } catch (error) {
      this.file.isValid = false;
      this.file.isLoaded = false;
      this.validationError = this.getCsvErrorMessage(error);
      throw error; // preserve actual error
    }
  }

  /**
   * Removes trailing newline from content to match file import behavior
   * @param content - The content to process
   * @returns Content without trailing newline
   * @private
   */
  private removeTrailingNewline(content: string): string {
    return content.slice(-1) === '\n' ? content.slice(0, -1) : content;
  }

  /**
   * Imports CSV data using the specified delimiter
   * @param csvText - The CSV text content
   * @param type - The data type (kvlist, etc.)
   * @param delimiter - The delimiter to use
   * @returns Parsed data object
   * @private
   */
  private importDataFromCSVWithDelimiter(csvText: string, type: string, delimiter: string): any {
    const normalizedText = this.normalizeLineEndings(csvText).trim();
    const rows = normalizedText.split('\n').filter(r => r.trim());

    const propertyNames = rows[0].split(delimiter).map(h => h.trim());
    const dataRows = rows.slice(1);

    if (type === 'kvlist') {
      const dataObj: Record<string, any> = {};
      dataRows.forEach(row => {
        const values = row.split(delimiter).map(v => v.trim());
        const key = values[0];
        const obj: Record<string, any> = {};
        for (let i = 1; i < propertyNames.length; i++) {
          obj[propertyNames[i]] = values[i];
        }
        dataObj[key] = obj;
      });
      return dataObj;
    } else {
      return dataRows.map(row => {
        const values = row.split(delimiter).map(v => v.trim());
        const obj: Record<string, any> = {};
        propertyNames.forEach((prop, i) => {
          obj[prop] = values[i];
        });
        return obj;
      });
    }
  }

  /**
   * Normalizes line endings to handle both LF and CRLF formats
   * @param text - The text content to normalize
   * @returns Text with normalized LF line endings
   * @private
   */
  private normalizeLineEndings(text: string): string {
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  /**
   * Validates JSON structure against configuration requirements
   * @param jsonData - The parsed JSON data to validate
   * @returns Promise<boolean> - True if valid, false otherwise
   * @private
   */
  private async validateJsonStructure(jsonData: any): Promise<boolean> {
    const tempFile = new File([this.manualContent], 'temp.json', { type: 'application/json' });
    return await this.fileImportService.isJsonFileValid(
      [tempFile],
      this.configuration.properties,
      this.configuration.type,
      this.configuration.keyName
    );
  }

  /**
   * Emits append event and resets the form
   * @public
   */
  appendFileData(): void {
    this.appendFile.emit({ fileData: this.file.data, delimiter: this.selectedDelimiter });
    this.formReset();
  }

  /**
   * Emits override event and resets the form
   * @public
   */
  overrideFileData(): void {
    this.overrideFile.emit({ fileData: this.file.data, delimiter: this.selectedDelimiter });
    this.formReset();
  }

  /**
   * Loads and processes uploaded files
   * @param files - Array of files to process
   * @public
   */
  async loadFile(files: File[]): Promise<void> {
    this.isLoading = true;
    this.ngProgress.start();

    try {
      if (files.length > 0) {
        this.file.isLoaded = false;
        this.tableData = null;
        this.file.name = this.fileImportService.getFileName(files);
        this.file.extension = this.fileImportService.getFileExtension(files).toLowerCase();
        this.file.isValidExtension = this.fileImportService.isExtensionValid(this.file.extension);

        if (this.file.isValidExtension) {
          await this.processFileByType(files);
        }
      }
    } catch (error) {
      this.handleProcessingError(error);
    } finally {
      this.ngProgress.done();
      this.isLoading = false;
    }
  }

  /**
   * Processes files based on their extension type
   * @param files - Array of files to process
   * @private
   */
  private async processFileByType(files: File[]): Promise<void> {
    if (this.file.extension === 'csv') {
      await this.processCsvFile(files);
    } else if (this.file.extension === 'json') {
      await this.processJsonFile(files);
    }
  }

  /**
   * Processes CSV files
   * @param files - Array of CSV files to process
   * @private
   */
  private async processCsvFile(files: File[]): Promise<void> {
    this.file.isValid = await this.fileImportService.isCsvFileValid(
      files,
      this.configuration.properties,
      this.configuration.type,
      this.configuration.keyName
    );

    if (this.file.isValid) {
      this.tableData = await this.fileImportService.getTableData(files);
      this.file.data = await this.fileImportService.importCsvData(files, this.configuration.type);
      this.file.isLoaded = true;
      this.validationError = '';
    } else {
      this.validationError = 'CSV Error: File validation failed. Check the file structure and required columns.';
    }
  }

  /**
   * Processes JSON files
   * @param files - Array of JSON files to process
   * @private
   */
  private async processJsonFile(files: File[]): Promise<void> {
    this.file.isValid = await this.fileImportService.isJsonFileValid(
      files,
      this.configuration.properties,
      this.configuration.type,
      this.configuration.keyName
    );

    if (this.file.isValid) {
      this.file.data = await this.fileImportService.importJsonData(files, this.configuration.type);
      this.tableData = this.fileImportService.getJsonTableData(
        this.file.data,
        this.getListConfigurationType(),
        this.configuration.keyName
      );
      this.file.isLoaded = true;
      this.validationError = '';
    } else {
      this.validationError = 'JSON Error: File validation failed. Check the JSON structure and required properties.';
    }
  }

  /**
   * Handles file input change events
   * @param event - The file input change event
   * @public
   */
  onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.loadFile(Array.from(target.files || []));
  }

  /**
   * Handles drag over events for file drop
   * @param event - The drag over event
   * @public
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  /**
   * Handles file drop events
   * @param event - The drop event
   * @public
   */
  onDropSuccess(event: DragEvent): void {
    event.preventDefault();
    this.loadFile(Array.from(event.dataTransfer?.files || []));
  }
}
