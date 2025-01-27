import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { FileImportService } from '../../../services/file-import.service';
import { ProgressBarService } from '../../../services';

@Component({
  selector: 'app-file-import-modal',
  templateUrl: './file-import-modal.component.html',
  styleUrls: ['./file-import-modal.component.css']
})
export class FileImportModalComponent {

  @Input() configuration;
  @Output() appendFile = new EventEmitter<any>();
  @Output() overrideFile = new EventEmitter<any>();

  isValidFileExtension = true;
  isValidFile = true;
  fileData;
  tableData;
  isFileLoaded = false;
  fileName = '';
  fileExtension;

  @ViewChild('fileImport', { static: true }) fileImport: ElementRef;
  constructor(public fileImportService: FileImportService,
    public ngProgress: ProgressBarService,
  ) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.formReset();
  }

  ngOnInit() { }

  public toggleModal(isOpen: Boolean) {
    const modalName = <HTMLDivElement>document.getElementById('modal-box');
    if (isOpen) {
      modalName.classList.add('is-active');
      return;
    }
    modalName.classList.remove('is-active');
  }

  formReset() {
    this.toggleModal(false);
    this.tableData = null;
    this.fileData = null;
    this.isFileLoaded = false;
    this.isValidFileExtension = true;
    this.isValidFile = true;
    this.fileName = '';
    this.fileImport.nativeElement.value = '';
  }

  appendFileData() {
    this.appendFile.emit({ fileData: this.fileData });
    this.formReset();
  }

  overrideFileData() {
    this.overrideFile.emit({ fileData: this.fileData });
    this.formReset();
  }

  async loadFile(files: File[]) {
    this.ngProgress.start();
    this.fileName = this.fileImportService.getFileName(files);
    this.fileExtension = this.fileImportService.getFileExtension(files).toLowerCase();
    this.isValidFileExtension = this.fileImportService.isExtensionValid(this.fileExtension);
    if (this.isValidFileExtension) {
      if (this.fileExtension == 'csv') {
        this.isValidFile = await this.fileImportService.isCsvFileValid(files, this.configuration.properties, this.configuration.type, this.configuration.keyName);
        if (this.isValidFile) {
          this.tableData = await this.fileImportService.getTableData(files);
          this.fileData = await this.fileImportService.importCsvData(files, this.configuration.type);
          this.isFileLoaded = true;
        }
      }
      else {
        this.isValidFile = await this.fileImportService.isJsonFileValid(files, this.configuration.properties, this.configuration.type, this.configuration.keyName);
        if (this.isValidFile) {
          this.fileData = await this.fileImportService.importJsonData(files, this.configuration.type);
          this.isFileLoaded = true;
        }
      }
    }
    this.ngProgress.done();
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
