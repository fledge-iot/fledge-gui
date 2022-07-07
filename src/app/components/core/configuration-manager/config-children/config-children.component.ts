import { Component, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { isEmpty } from 'lodash';

import { ConfigurationService } from '../../../../services';
import { ViewConfigItemComponent } from '../view-config-item/view-config-item.component';

@Component({
  selector: 'app-config-children',
  templateUrl: './config-children.component.html',
  styleUrls: ['./config-children.component.css']
})
export class ConfigChildrenComponent {
  seletedTab = '';
  useCategoryChildrenProxy = 'true'
  childCategoryKey = ''
  configuration: any;

  @Input() categoryChildren = []
  @Input() categoryName = ''

  @Output() onConfigChanged: EventEmitter<any> = new EventEmitter<any>();
  @ViewChildren('childrenConfigView') childrenConfigViewComponents: QueryList<ViewConfigItemComponent>;

  constructor(private configService: ConfigurationService) { }

  ngOnChanges() {
    this.selectTab(this.categoryChildren[0]);
  }

  /**
   * Set configuration of the selected child category
   * @param category Object{key, description, displayName}
   */
  selectTab(category: any) {
    this.seletedTab = category.displayName;
    this.childCategoryKey = category.key;
    this.getConfig(category.key);
    this.useCategoryChildrenProxy = 'true';
  }

  /**
   * Get configuration of the child category
   * @param categoryName : String
   */
  getConfig(categoryName: string) {
    this.configService.getCategory(categoryName).
      subscribe(
        (data: any) => {
          // set configuration to pass on view-config-item-component page
          this.configuration = { key: categoryName, value: [data] };
        },
        error => {
          console.log('error ', error);
        }
      );
  }

  /**
   * Get changed value of the configuration item
   * @param changedConfig: Object
   * @returns updated value Object
   */
  getChangedConfig(changedConfig) {
    if (isEmpty(changedConfig)) {
      return;
    }
    changedConfig = changedConfig.map(el => {
      if (el.type.toUpperCase() === 'JSON') {
        el.value = JSON.parse(el.value);
      }
      return {
        [el.key]: el.value !== undefined ? el.value : el.default,
      };
    });

    changedConfig = Object.assign({}, ...changedConfig); // merge all object into one
    if (!isEmpty(changedConfig)) {
      // emit child changed config on south service modal
      this.onConfigChanged.emit({ key: this.childCategoryKey, value: changedConfig });
    }
  }
}
