import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-file-import-modal',
  templateUrl: './file-import-modal.component.html',
  styleUrls: ['./file-import-modal.component.css']
})
export class FileImportModalComponent {

  @Input() tableData;
  @Output() appendFile = new EventEmitter<any>();
  @Output() overrideFile = new EventEmitter<any>();

  constructor() { }

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
  }

  appendFileData() {
    this.appendFile.emit({ appendFile: true });
    this.toggleModal(false);
  }

  overrideFileData() {
    this.overrideFile.emit({ overrideFile: true });
    this.toggleModal(false);
  }
}
