import { Component, Input } from '@angular/core';
import { ConfigurationService, RolesService } from '../../../../services';
import { DeveloperFeaturesService } from '../../../../services/developer-features.service';
import { chain } from 'lodash';

@Component({
  selector: 'app-config-children',
  templateUrl: './config-children.component.html',
  styleUrls: ['./config-children.component.css']
})
export class ConfigChildrenComponent {
  seletedTab = 'Default Configuration';
  useCategoryChildrenProxy = 'true';
  categoryKey = '';
  categoryChildren = [];
  @Input() category;
  groups = [];
  @Input() plugin;
  @Input() serviceStatus = false;
  @Input() from;

  pages = ['south', 'north']

  constructor(
    private configService: ConfigurationService,
    public developerFeaturesService: DeveloperFeaturesService,
    public rolesService: RolesService
  ) { }

  ngOnInit() {
    const configItems = Object.keys(this.category.value[0]).map(k => {
      this.category.value[0][k].key = k;
      return this.category.value[0][k];
    });

    this.groups = chain(configItems).groupBy(x => x.group).map((v, k) => {
      if (k != "undefined") {
        return { category: this.category.key, group: k, values: [Object.assign({}, ...v.map(vl => { return { [vl.key]: vl } }))] }
      } else {
        // return { group: "Default", values: v }
        return { category: this.category.key, group: "Default Configuration", values: [Object.assign({}, ...v.map(vl => { return { [vl.key]: vl } }))] }
      }
    }).value();

    this.getChildConfigData();
  }

  public getChildConfigData() {
    if (this.category) {
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
  selectTab(tab: string) {
    console.log(tab);

    if (tab !== this.seletedTab) {
      this.seletedTab = tab;
    }
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
            this.groups.push({ category: category.key, group: category.key, values: [data] })
          } else if (category.key.includes('Security')) {
            this.groups.push({ category: category.key, group: category.key, values: [data] })
          }
        },
        error => {
          console.log('error ', error);
        }
      );
  }
}
