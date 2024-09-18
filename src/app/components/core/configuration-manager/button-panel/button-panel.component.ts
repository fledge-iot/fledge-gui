import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-button-panel',
  templateUrl: './button-panel.component.html',
  styleUrls: ['./button-panel.component.css']
})
export class ButtonPanelComponent {

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
