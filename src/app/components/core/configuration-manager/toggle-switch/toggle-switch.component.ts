import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-toggle-switch',
  templateUrl: './toggle-switch.component.html',
  styleUrls: ['./toggle-switch.component.css']
})
export class ToggleSwitchComponent {
  @Output() currentView = new EventEmitter<any>();

  setCurrentView(view: string) {
    if (view == 'list') {
      this.currentView.emit({ isListView: true });
    }
    else {
      this.currentView.emit({ isListView: false });
    }
  }
}
