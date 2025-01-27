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

  tableData;
  file = { name: '', extension: '', isLoaded: false, data: null, isValid: true, isValidExtension: true }

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
        }
      }
      else {
        this.file.isValid = await this.fileImportService.isJsonFileValid(files, this.configuration.properties, this.configuration.type, this.configuration.keyName);
        if (this.file.isValid) {
          this.file.data = await this.fileImportService.importJsonData(files, this.configuration.type);
          this.file.isLoaded = true;
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
