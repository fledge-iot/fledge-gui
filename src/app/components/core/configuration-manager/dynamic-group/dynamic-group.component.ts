import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dynamic-group',
  templateUrl: './dynamic-group.component.html',
  styleUrls: ['./dynamic-group.component.css']
})
export class DynamicGroupComponent {
  @Input() categoryGroups: any[] = [];
  @Input() selectedGroup: any;
  @Input() selectedCategoryGroup: any;
  @Input() g: any;
  @Input() from: any;
  @Output() getChangedConfiguration = new EventEmitter<any>();
  @Output() formStatusEvent = new EventEmitter<any>();
  @Output() selectSubTab = new EventEmitter<any>();

  getChangedConfig(event) {
    this.getChangedConfiguration.emit(event);
  }

  formStatus(event) {
    this.formStatusEvent.emit(event);
  }

  selectTab(event) {
    this.selectSubTab.emit(event);
  }
}
