import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { CsvService } from '../../../services/csv.service';
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
  constructor(public csvService: CsvService,
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
    this.isFileLoaded = false;
    this.tableData = null;
    this.fileName = this.getFileName(files);
    this.fileExtension = this.getFileExtension(files).toLowerCase();
    this.isValidFileExtension = this.isExtensionValid(this.fileExtension);
    if (this.isValidFileExtension) {
      if (this.fileExtension == 'csv') {
        this.isValidFile = await this.csvService.isFileValid(files, this.configuration.properties, this.configuration.type, this.configuration.keyName);
        if (this.isValidFile) {
          this.tableData = await this.csvService.getTableData(files);
          this.fileData = await this.csvService.importData(files, this.configuration.type);
          this.isFileLoaded = true;
        }
      }
      else {
        this.isValidFile = await this.csvService.isJsonFileValid(files, this.configuration.properties, this.configuration.type, this.configuration.keyName);
        if (this.isValidFile) {
          this.fileData = await this.csvService.importJsonData(files, this.configuration.type);
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

  getFileName(files: File[]) {
    const file: File = files[0];
    return file.name;
  }

  getFileExtension(files: File[]) {
    const file: File = files[0];
    return file.name.substring(file.name.lastIndexOf('.') + 1);
  }

  isExtensionValid(ext) {
    if (ext == 'csv' || ext == 'json') {
      return true;
    }
    return false;
  }
}
