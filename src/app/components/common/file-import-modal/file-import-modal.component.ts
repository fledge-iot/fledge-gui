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
  // Constants
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
  @Output() appendFile = new EventEmitter<{ fileData: any }>();
  @Output() overrideFile = new EventEmitter<{ fileData: any }>();

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
  constructor(public fileImportService: FileImportService,
    public ngProgress: ProgressBarService,
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
    if (this.isManualMode) {
      this.manualContent = '';
      this.detectedFormat = '';
      this.validationError = '';
      this.selectedDelimiter = ',';
      this.updateCodeMirrorMode('text/plain');
    } else {
      // Reset to file upload mode without closing modal
      this.manualContent = '';
      this.detectedFormat = '';
      this.validationError = '';
      this.selectedDelimiter = ',';
      this.file = { ...FileImportModalComponent.DEFAULT_FILE_DATA };
      this.tableData = null;
      if (this.fileImport?.nativeElement) {
        this.fileImport.nativeElement.value = '';
      }
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

    // Try to detect JSON first
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

    // Detect CSV format; try to auto-detect delimiter first
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length >= 2) {
      const firstLine = lines[0];
      const secondLine = lines[1];

      // Auto-detect among common delimiters: Tab, Comma, Semicolon, Pipe, Colon
      const candidates = ['\t', ',', ';', '|', ':'];
      let bestDelimiter = this.selectedDelimiter;
      let bestScore = -1;
      for (const d of candidates) {
        const re = new RegExp(this.escapeRegExp(d), 'g');
        const c1 = (firstLine.match(re) || []).length;
        const c2 = (secondLine.match(re) || []).length;
        const score = (c1 > 0 && c1 === c2) ? c1 : -1;
        if (score > bestScore) {
          bestScore = score;
          bestDelimiter = d;
        }
      }
      if (bestScore > 0) {
        this.selectedDelimiter = bestDelimiter;
      }

      // Check if first line has the selected delimiter and second line has similar structure
      if (firstLine.includes(this.selectedDelimiter) && secondLine.includes(this.selectedDelimiter)) {
        const firstLineDelimiters = (firstLine.match(new RegExp(this.escapeRegExp(this.selectedDelimiter), 'g')) || []).length;
        const secondLineDelimiters = (secondLine.match(new RegExp(this.escapeRegExp(this.selectedDelimiter), 'g')) || []).length;

        if (firstLineDelimiters === secondLineDelimiters && firstLineDelimiters > 0) {
          this.detectedFormat = 'CSV';
          this.validationError = '';
          this.updateCodeMirrorMode('text/csv');
          return;
        } else if (firstLineDelimiters !== secondLineDelimiters) {
          this.validationError = `CSV Error: Inconsistent column count. Header has ${firstLineDelimiters + 1} columns, but data row has ${secondLineDelimiters + 1} columns.`;
        }
      } else if (lines.length >= 2 && !firstLine.includes(this.selectedDelimiter) && !secondLine.includes(this.selectedDelimiter)) {
        this.validationError = `CSV Error: No ${this.getDelimiterDisplayName()} separators found. CSV files must use ${this.getDelimiterDisplayName()} to separate columns.`;
      } else if (lines.length < 2) {
        this.validationError = 'CSV Error: CSV files must have at least a header row and one data row.';
      }
    } else if (lines.length === 1) {
      this.validationError = 'CSV Error: CSV files must have at least a header row and one data row.';
    } else {
      this.validationError = 'CSV Error: Empty or invalid CSV content.';
    }

    // Default to plain text
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
    const message = error.message || 'Unknown JSON error';

    // Common JSON error patterns and their user-friendly messages
    if (message.includes('Unexpected token')) {
      if (message.includes('in JSON at position')) {
        const position = message.match(/at position (\d+)/)?.[1];
        return `Invalid JSON syntax at position ${position}. Check for missing quotes, brackets, or trailing commas.`;
      }
      return 'Invalid JSON syntax. Check for missing quotes, brackets, or commas.';
    }

    if (message.includes('Unexpected end of JSON input')) {
      return 'Incomplete JSON. Check for missing closing brackets or quotes.';
    }

    if (message.includes('Expected')) {
      return 'Invalid JSON format. Check the structure and syntax.';
    }

    // Return the original message if no pattern matches
    return `JSON Error: ${message}`;
  }

  /**
   * Extracts a user-friendly error message from CSV processing errors
   * @param error - The CSV processing error
   * @returns User-friendly error message
   * @private
   */
  private getCsvErrorMessage(error: any): string {
    const message = error.message || 'Unknown CSV error';

    // Common CSV error patterns and their user-friendly messages
    if (message.includes('Invalid CSV structure')) {
      return 'CSV Error: Invalid structure. Check that all rows have the same number of columns.';
    }

    if (message.includes('Missing required properties')) {
      return 'CSV Error: Missing required columns. Check that all required properties are present in the header row.';
    }

    if (message.includes('Invalid data type')) {
      return 'CSV Error: Invalid data format. Check that data values match the expected format.';
    }

    if (message.includes('Empty file')) {
      return 'CSV Error: File is empty or contains no valid data.';
    }

    if (message.includes('No header row')) {
      return 'CSV Error: No header row found. CSV files must start with column names.';
    }

    // Return the original message if no pattern matches
    return `CSV Error: ${message}`;
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
    console.error('Error processing content:', error);
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
    } catch (error) {
      this.file.isValid = false;
      this.validationError = this.getJsonErrorMessage(error);
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
  }

  /**
   * Processes manually pasted CSV content
   * @private
   */
  private async processManualCsv(): Promise<void> {
    try {
      // Create a temporary file-like object for validation
      const tempFile = new File([this.manualContent], 'temp.csv', { type: 'text/csv' });

      this.file.extension = 'csv';
      this.file.isValidExtension = true;

      // Validate CSV structure
      this.file.isValid = await this.fileImportService.isCsvFileValid(
        [tempFile],
        this.configuration.properties,
        this.configuration.type,
        this.configuration.keyName
      );

      if (this.file.isValid) {
        // Preprocess content to match file import behavior (remove trailing newline)
        const processedContent = this.removeTrailingNewline(this.manualContent);

        this.file.data = this.importDataFromCSVWithDelimiter(processedContent, this.configuration.type, this.selectedDelimiter);
        // Normalize preview to comma-separated so the table splitting by ',' renders correctly
        let previewText = processedContent;
        if (this.selectedDelimiter !== ',') {
          const re = new RegExp(this.escapeRegExp(this.selectedDelimiter), 'g');
          previewText = processedContent.replace(re, ',');
        }
        this.tableData = previewText.split('\n').filter(line => line.trim());
        this.file.isLoaded = true;
      }
    } catch (error) {
      this.file.isValid = false;
      this.validationError = this.getCsvErrorMessage(error);
      throw new Error(`Invalid CSV format: ${error.message}`);
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
    // Normalize line endings to handle both LF and CRLF
    const normalizedText = this.normalizeLineEndings(csvText);
    const propertyNames = normalizedText.slice(0, normalizedText.indexOf('\n')).split(delimiter);
    const dataRows = normalizedText.slice(normalizedText.indexOf('\n') + 1).split('\n');

    if (type === 'kvlist') {
      let dataObj = {};
      dataRows.forEach((row) => {
        let values = row.split(delimiter);
        let obj = new Object();
        for (let index = 0; index < propertyNames.length; index++) {
          if (index !== 0) {
            const propertyName = propertyNames[index];
            let val = values[index];
            obj[propertyName] = val;
          }
        }
        dataObj[values[0]] = obj;
      });
      return dataObj;
    } else {
      let dataArray = [];
      dataRows.forEach((row) => {
        let values = row.split(delimiter);
        let obj = new Object();
        for (let index = 0; index < propertyNames.length; index++) {
          const propertyName = propertyNames[index];
          let val = values[index];
          obj[propertyName] = val;
        }
        dataArray.push(obj);
      });
      return dataArray;
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
    // Create a temporary file-like object for validation
    const tempFile = new File([this.manualContent], 'temp.json', { type: 'application/json' });
    return await this.fileImportService.isJsonFileValid([tempFile], this.configuration.properties, this.configuration.type, this.configuration.keyName);
  }

  /**
   * Emits append event and resets the form
   * @public
   */
  appendFileData(): void {
    this.appendFile.emit({ fileData: this.file.data });
    this.formReset();
  }

  /**
   * Emits override event and resets the form
   * @public
   */
  overrideFileData(): void {
    this.overrideFile.emit({ fileData: this.file.data });
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
