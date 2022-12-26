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
    this.categeryConfiguration();
    this.getChildConfigData();
  }

  categeryConfiguration() {
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
          let group = category.key;
          if (category.key === `${this.categoryKey}Advanced`) {
            group = 'Advance Configuration';
          } else if (category.key === `${this.categoryKey}Security`) {
            group = 'Security Configuration';
          }
          this.upsertConfiguration(this.groups, { category: category.key, group, values: [data] });
        },
        error => {
          console.log('error ', error);
        }
      );
  }

  upsertConfiguration(array, element) {
    const i = array.findIndex(_element => _element.category === element.category);
    if (i > -1) {
      array[i] = element;
    }
    else {
      array.push(element);
    }
  }
}
