import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-filter-alert',
  templateUrl: './filter-alert.component.html',
  styleUrls: ['./filter-alert.component.css']
})
export class FilterAlertComponent implements OnInit, OnChanges {
  @Input() filerDialogData: { id: Number, name: any, key: any, message: any, actionButtonValue: any, headerTextValue: any };
  @Output() discardChanges = new EventEmitter<Boolean>();

  constructor() { }

  ngOnInit() { }

  ngOnChanges() {
    if (this.filerDialogData) {
      if (this.filerDialogData.key === 'unsavedConfirmation') {
        this.filerDialogData.actionButtonValue = 'Discard';
        this.filerDialogData.headerTextValue = 'Discard Changes';
      }
    }
  }

  public toggleModal(isOpen: Boolean) {
    const alertModal = <HTMLDivElement>document.getElementById('filter-dialog-box');
    if (isOpen) {
      alertModal.classList.add('is-active');
      return;
    }
    alertModal.classList.remove('is-active');
  }

  triggerAction() {
    if (this.filerDialogData) {
      if (this.filerDialogData.key === 'unsavedConfirmation') {
        this.discardChanges.emit(true);
        this.toggleModal(false);
      }
    }
  }
}
