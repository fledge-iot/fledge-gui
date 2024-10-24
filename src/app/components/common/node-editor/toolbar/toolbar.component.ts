import { Component, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent {
  @Input() isDisabled = new EventEmitter<boolean>();
  @Output() reloadData = new EventEmitter<Object>();
  @Output() resetNodes = new EventEmitter<Object>();
  @Output() undo = new EventEmitter<Object>();
  @Output() redo = new EventEmitter<Object>();
  @Output() delete = new EventEmitter<Object>();

  reload() {
    this.reloadData.emit(true);
  }

  reset() {
    this.resetNodes.emit(true);
  }

  undoAction() {
    this.undo.emit(true);
  }

  redoAction() {
    this.redo.emit(true);
  }

  deleteAction() {
    this.delete.emit(true);
  }
}
