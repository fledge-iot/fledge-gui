import { Component, Input, QueryList, SimpleChange, ViewChildren } from '@angular/core';

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
  categoryKey = ''
  advanceConfiguration: any;
  securityConfiguration: any;

  @Input() categoryChildren = []
  @Input() category;

  @ViewChildren('childrenConfigView') childrenConfigViewComponents: QueryList<ViewConfigItemComponent>;

  constructor(private configService: ConfigurationService) { }

  ngOnChanges(changes: SimpleChange) {
    if (this.category) {
      this.seletedTab = this.category.key
      this.categoryKey = this.category.key;
    }
    if (changes['categoryChildren']?.currentValue.length > 0) {
      // Filter out Advance and Security category from the main categroy children
      this.categoryChildren = this.categoryChildren.filter(cat => (cat.key == `${this.categoryKey}Advanced`) || (cat.key == `${this.categoryKey}Security`));
      this.categoryChildren.forEach(cat => {
        // Get child category configuration
        this.getConfig(cat);
      });
    }
  }

  /**
   * Set configuration of the selected child category
   * @param category Object{key, description, displayName}
   */
  selectTab(category: any) {
    this.seletedTab = category?.displayName;
    this.categoryKey = category?.key;
    this.useCategoryChildrenProxy = 'true';
  }

  /**
   * Get configuration of the child category
   * @param categoryName : String
   */
  getConfig(category: any) {
    this.configService.getCategory(category.key).
      subscribe(
        (data: any) => {
          // set configuration to pass on view-config-item-component page
          if (category.key.includes('Advanced')) {
            this.advanceConfiguration = { key: category.key, value: [data] };
          } else if (category.key.includes('Security')) {
            this.securityConfiguration = { key: category.key, value: [data] };
          }
        },
        error => {
          console.log('error ', error);
        }
      );
  }
}
