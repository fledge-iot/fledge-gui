import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ConfigurationBase } from '../../../../services';

@Component({
  selector: 'app-dynamic-group',
  templateUrl: './dynamic-group.component.html',
  styleUrls: ['./dynamic-group.component.css']
})
export class DynamicGroupComponent implements OnInit, OnChanges {
  @Input() categoryGroups: any[] = [];
  @Input() selectedGroup: any;
  @Input() selectedCategoryGroup: any;
  @Input() group: any;
  @Input() from: any;
  @Output() getChangedConfiguration = new EventEmitter<any>();
  @Output() formStatusEvent = new EventEmitter<any>();
  @Output() selectSubTab = new EventEmitter<any>();

  public sharedFullConfiguration: { [key: string]: ConfigurationBase<string> } = {};

  ngOnInit() {
    this.initializeSharedConfiguration();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.categoryGroups || changes.group) {
      this.initializeSharedConfiguration();
    }
  }

  initializeSharedConfiguration(): void {
    this.sharedFullConfiguration = {};

    if (this.categoryGroups.length === 0 && this.group?.config) {
      this.sharedFullConfiguration = { ...this.group.config };
      return;
    }

    this.categoryGroups.forEach(categoryGroup => {
      if (categoryGroup?.config) {
        if (categoryGroup.key) {
          this.sharedFullConfiguration[categoryGroup.key] = { ...categoryGroup.config };
        } else {
          Object.keys(categoryGroup.config).forEach(key => {
            this.sharedFullConfiguration[key] = { ...categoryGroup.config[key] };
          });
        }
      }
    });
  }

  getChangedConfig(event: any) {
    if (!event || Object.keys(event).length === 0) {
      return;
    }

    try {
      Object.keys(event).forEach(key => {
        if (this.sharedFullConfiguration[key]) {
          this.sharedFullConfiguration[key].value = event[key];
        }
      });

      this.sharedFullConfiguration = { ...this.sharedFullConfiguration };
      this.updateCategoryGroupConfigurations(event);
      this.getChangedConfiguration.emit(event);
    } catch (error) {
      console.error('Error updating configuration in dynamic group:', error);
      this.getChangedConfiguration.emit(event);
    }
  }

  private updateCategoryGroupConfigurations(changedConfig: any) {
    try {
      this.categoryGroups.forEach(categoryGroup => {
        if (categoryGroup?.config) {
          Object.keys(changedConfig).forEach(key => {
            if (categoryGroup.config[key]) {
              categoryGroup.config[key].value = changedConfig[key];
            }
          });
        }
      });

      if (this.categoryGroups.length === 0 && this.group?.config) {
        Object.keys(changedConfig).forEach(key => {
          if (this.group.config[key]) {
            this.group.config[key].value = changedConfig[key];
          }
        });
      }
    } catch (error) {
      console.error('Error updating category group configurations:', error);
    }
  }

  formStatus(event) {
    this.formStatusEvent.emit(event);
  }

  selectTab(event) {
    this.selectSubTab.emit(event);
  }
}
