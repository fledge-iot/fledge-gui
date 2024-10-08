import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-button-panel',
  templateUrl: './button-panel.component.html',
  styleUrls: ['./button-panel.component.css']
})
export class ButtonPanelComponent {

  @Input() isFormValid = true;
  @Input() isAddButtonVisible = true;
  @Output() addnewItem = new EventEmitter<any>();
  @Output() expandAll = new EventEmitter<any>();
  @Output() collapseAll = new EventEmitter<any>();

  addItem() {
    this.addnewItem.emit({addItem: true});
  }

  expandAllItems() {
    this.expandAll.emit({expandAll: true});
  }

  collapseAllItems() {
    this.collapseAll.emit({collapseAll: true});
  }
}
