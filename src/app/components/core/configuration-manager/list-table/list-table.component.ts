import { KeyValue } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RolesService } from '../../../../services';
import { FormArray, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-list-table',
  templateUrl: './list-table.component.html',
  styleUrls: ['./list-table.component.css']
})
export class ListTableComponent {
  @Input() from;
  @Input() listType;
  @Input() configuration;
  @Input() validConfigurationForm;
  @Input() listItemsForm: FormGroup;
  @Output() removeItem = new EventEmitter<any>();
  @Output() addItem = new EventEmitter<any>();
  @Output() openModalEvent = new EventEmitter<any>();
  @Output() exportFile = new EventEmitter<any>();
  originalOrder = (a: KeyValue<number, string>, b: KeyValue<number, string>): number => { return 0; }

  constructor(
    public rolesService: RolesService) {
  }

  get listItems() {
    if (this.listType == 'list') {
      return this.listItemsForm.get('listItems') as FormArray;
    }
    return this.listItemsForm.get('kvListItems') as FormArray;
  }

  removeListItem(index) {
    this.removeItem.emit(index);
  }

  addListItem() {
    this.addItem.emit(true);
  }

  openModal() {
    this.openModalEvent.emit(true);
  }

  openExportFileModal() {
    this.exportFile.emit(true);
  }
}
