import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent {
  @Output() reloadData = new EventEmitter<Object>();
  @Output() resetNodes = new EventEmitter<Object>();

  reload() {
    this.reloadData.emit(true);
  }

  reset() {
    this.resetNodes.emit(true);
  }

  undo() {
    console.log('undo');
  }

  redo() {
    console.log('redo');
  }
}
