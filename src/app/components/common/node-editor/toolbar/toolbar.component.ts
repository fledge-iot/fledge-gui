import { Component, Output, EventEmitter, Input, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent {
  @Input() isDeleteDisabled = new EventEmitter<boolean>();
  @Input() historyData = new EventEmitter<Object>();
  @Output() reloadData = new EventEmitter<Object>();
  @Output() resetNodes = new EventEmitter<Object>();
  @Output() undo = new EventEmitter<Object>();
  @Output() redo = new EventEmitter<Object>();
  @Output() delete = new EventEmitter<Object>();
  @Output() debug = new EventEmitter<boolean>();
  @Input() debuggerState: string;


  ngOnChanges(changes: SimpleChanges) {
    if (changes['debuggerState']) {
      this.debuggerState = changes['debuggerState'].currentValue;
    }
  }

  ngOnInit() { }

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

  debugService() {
    this.debug.emit(true);
  }
}
