import { Component, OnInit } from '@angular/core';
import { DialogService } from '../../common/confirmation-dialog/dialog.service';

@Component({
  selector: 'app-unsaved-changes-dialog',
  templateUrl: './unsaved-changes-dialog.component.html',
  styleUrls: ['./unsaved-changes-dialog.component.css']
})
export class UnsavedChangesDialogComponent implements OnInit {

  modalId = 'unsaved-changes-dialog';
  constructor(private dialogService: DialogService) { }

  ngOnInit() {
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  discardUnsavedChanges() {
    this.dialogService.resetChangesEmitter?.emit(true);
  }

}
