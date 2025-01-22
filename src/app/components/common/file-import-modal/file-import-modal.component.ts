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

  @ViewChild('fileImport', { static: true }) fileImport: ElementRef;
  constructor(public csvService: CsvService,) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.formReset();
    event.stopImmediatePropagation();
    event.preventDefault()
  }

  ngOnInit() { }

  public toggleModal(isOpen: Boolean) {
    const modalName = <HTMLDivElement>document.getElementById('fileUpload');
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

  async loadFile(event: any) {
    this.isFileLoaded = false;
    this.tableData = null;
    this.isValidFileExtension = this.csvService.isExtensionValid(event);
    this.isValidFile = await this.csvService.isFileValid(event, this.properties);
    if (this.isValidFileExtension && this.isValidFile) {
      this.tableData = await this.csvService.getTableData(event);
      this.fileData = await this.csvService.importData(event);
      this.isFileLoaded = true;
    }
  }
}
