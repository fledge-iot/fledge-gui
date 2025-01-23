import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { CsvService } from '../../../services/csv.service';

@Component({
  selector: 'app-file-import-modal',
  templateUrl: './file-import-modal.component.html',
  styleUrls: ['./file-import-modal.component.css']
})
export class FileImportModalComponent {

  @Input() properties;
  @Output() appendFile = new EventEmitter<any>();
  @Output() overrideFile = new EventEmitter<any>();

  isValidFileExtension = true;
  isValidFile = true;
  fileData;
  tableData;
  isFileLoaded = false;
  fileName = '';

  @ViewChild('fileImport', { static: true }) fileImport: ElementRef;
  constructor(public csvService: CsvService,) { }

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
    this.isFileLoaded = false;
    this.tableData = null;
    this.fileName = this.csvService.getFileName(files);
    this.isValidFileExtension = this.csvService.isExtensionValid(files);
    this.isValidFile = await this.csvService.isFileValid(files, this.properties);
    if (this.isValidFileExtension && this.isValidFile) {
      this.tableData = await this.csvService.getTableData(files);
      this.fileData = await this.csvService.importData(files);
      this.isFileLoaded = true;
    }
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
