import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-toggle-switch',
  templateUrl: './toggle-switch.component.html',
  styleUrls: ['./toggle-switch.component.css']
})
export class ToggleSwitchComponent {
  @Output() currentView = new EventEmitter<any>();
  @Input() isListView;

  setCurrentView(view: string) {
    if (view == 'list') {
      this.isListView = true;
      this.currentView.emit({ isListView: true });
    }
    else {
      this.isListView = false;
      this.currentView.emit({ isListView: false });
    }
  }
}
