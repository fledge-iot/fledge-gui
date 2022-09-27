import { Component, Input } from '@angular/core';

import { ConfigurationService } from '../../../../services';
import { DeveloperFeaturesService } from '../../../../services/developer-features.service';


@Component({
  selector: 'app-config-children',
  templateUrl: './config-children.component.html',
  styleUrls: ['./config-children.component.css']
})
export class ConfigChildrenComponent {
  seletedTab = '';
  useCategoryChildrenProxy = 'true';
  categoryKey = '';
  advanceConfiguration: any;
  securityConfiguration: any;

  categoryChildren = [];
  @Input() category;
  @Input() plugin;
  @Input() serviceStatus = false;
  @Input() from;

  pages = ['south', 'north']

  constructor(
    private configService: ConfigurationService,
    public developerFeaturesService: DeveloperFeaturesService,
  ) { }

  ngOnInit() {
    this.getChildConfigData();
  }

  public getChildConfigData() {
    if (this.category) {
      this.seletedTab = this.category.key
      this.categoryKey = this.category.key;
      this.checkIfAdvanceConfig(this.category.key)
    }
  }

  checkIfAdvanceConfig(categoryName: string) {
    this.configService.getCategoryConfigChildren(categoryName).
      subscribe(
        (data: any) => {
          this.categoryChildren = data.categories?.filter(cat => (cat.key == `${this.categoryKey}Advanced`) || (cat.key == `${this.categoryKey}Security`));
          this.categoryChildren.forEach(cat => {
            // Get child category configuration
            this.getConfig(cat);
          });
        },
        error => {
          console.log('error ', error);
        }
      );
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
