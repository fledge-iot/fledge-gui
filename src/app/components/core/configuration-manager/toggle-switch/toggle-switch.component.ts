import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-toggle-switch',
  templateUrl: './toggle-switch.component.html',
  styleUrls: ['./toggle-switch.component.css']
})
export class ToggleSwitchComponent {
  @Output() currentView = new EventEmitter<'list' | 'detailed' | 'json' | 'csv'>();
  @Input() activeView: 'list' | 'detailed' | 'json' | 'csv' = 'list';
  @Input() isFormValid = false;

  setCurrentView(view: 'list' | 'detailed' | 'json' | 'csv') {
    this.activeView = view;
    this.currentView.emit(view);
  }
}
