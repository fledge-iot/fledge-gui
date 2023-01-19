import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ConfigurationControlService, ConfigurationService, RolesService } from '../../../../services';
import { DeveloperFeaturesService } from '../../../../services/developer-features.service';
import { chain, cloneDeep } from 'lodash';

@Component({
  selector: 'app-configuration-group',
  templateUrl: './configuration-group.component.html',
  styleUrls: ['./configuration-group.component.css']
})
export class ConfigurationGroupComponent implements OnInit {

  selectedGroup = 'Default Configuration';
  @Input() category;
  groups = [];

  @Output() changedConfigEvent = new EventEmitter<any>();
  @Output() formStatusEvent = new EventEmitter<boolean>();
  @Output() changedAdvanceConfigEvent = new EventEmitter<any>();

  // To hold the changed configuration values of a plugin
  configFormValues = {};

  pages = ['south', 'north'];
  @Input() from;
  categoryKey = '';

  advanceConfiguration: any
  securityConfiguration: any;
  changedAdvanceConfiguration: any;
  changedSecurityConfiguration: any;

  constructor(
    public developerFeaturesService: DeveloperFeaturesService,
    public rolesService: RolesService,
    private configService: ConfigurationService,
    private configurationControlService: ConfigurationControlService,
  ) { }

  ngOnInit() {
    this.categeryConfiguration();
    this.getChildConfigData();
  }

  public updateCategroyConfig(config) {
    this.category.config = config;
    this.getChildConfigData();
    this.categeryConfiguration();
  }

  categeryConfiguration() {
    this.groups = [];
    const configItems = Object.keys(this.category.config).map(k => {
      this.category.config[k].key = k;
      return this.category.config[k];
    });

    this.groups = chain(configItems).groupBy(x => x.group).map((v, k) => {
      if (k != "undefined") {
        return { category: this.category.name, group: k, config: Object.assign({}, ...v.map(vl => { return { [vl.key]: vl } })) }
      } else {
        return { category: this.category.name, group: "Default Configuration", config: Object.assign({}, ...v.map(vl => { return { [vl.key]: vl } })) }
      }
    }).value();
  }

  /**
   * Set configuration of the selected child category
   * @param category Object{key, description, displayName}
   */
  selectTab(tab: string) {
    if (tab !== this.selectedGroup) {
      this.selectedGroup = tab;
    }
  }

  public getChildConfigData() {
    // No advance configuration on add form
    if (['add-task-form', 'add-service-form', 'add-filter', 'north-filter'].includes(this.from)) {
      return;
    }
    if (this.category) {
      this.categoryKey = this.category.name;
      this.checkIfAdvanceConfig(this.category.name)
    }
  }

  checkIfAdvanceConfig(categoryName: string) {
    this.configService.getCategoryConfigChildren(categoryName).
      subscribe(
        (data: any) => {
          const categoryChildren = data.categories?.filter(cat => (cat.key == `${this.categoryKey}Advanced`) || (cat.key == `${this.categoryKey}Security`));
          categoryChildren.forEach(cat => {
            // Set group of advance/security configuration
            cat.group = cat?.key.includes(`${this.categoryKey}Advanced`) ? 'Advanced Configuration' :
              (cat?.key.includes(`${this.categoryKey}Security`) ? 'Security Configuration' : cat?.displayName);
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
  * Get configuration of the child category
  * @param categoryName : String
  */
  getConfig(category: any) {
    this.configService.getCategory(category.key).
      subscribe(
        (data: any) => {
          if (category.key == `${this.categoryKey}Advanced`) {
            this.advanceConfiguration = { key: category.key, config: cloneDeep(data) };
          }
          if (category.key == `${this.categoryKey}Security`) {
            this.securityConfiguration = { key: category.key, config: cloneDeep(data) };
          }

          this.upsertAdvanceConfiguration(this.groups, { category: category.key, group: category.group, config: data });
        },
        error => {
          console.log('error ', error);
        }
      );
  }

  getChangeConfiguration(values: {}) {
    this.configFormValues = Object.assign({}, this.configFormValues, values);
    this.changedConfigEvent.emit(this.configFormValues)
  }

  /**
   * Get edited advance configuration
   * @param changedConfiguration changed configuration
   */
  getChangedAdvanceConfiguration(changedConfiguration: any) {
    Object.keys(this.advanceConfiguration.config).map(k => {
      this.advanceConfiguration.config[k].key = k;
      return this.advanceConfiguration.config[k]
    });
    this.changedAdvanceConfiguration = Object.assign({}, this.changedAdvanceConfiguration, changedConfiguration);
    const change = this.configurationControlService.getChangedConfiguration(this.changedAdvanceConfiguration, this.advanceConfiguration);
    this.changedAdvanceConfigEvent.emit({ key: this.advanceConfiguration.key, config: change });
  }

  /**
   * Get edited advance security configuration
   * @param changedConfiguration changed configuration of security category
   */
  getChangedSecurityConfiguration(changedConfiguration: any) {
    Object.keys(this.securityConfiguration.config).map(k => {
      this.securityConfiguration.config[k].key = k;
      return this.securityConfiguration.config[k]
    });
    this.changedSecurityConfiguration = Object.assign({}, this.changedSecurityConfiguration, changedConfiguration);
    const change = this.configurationControlService.getChangedConfiguration(this.changedSecurityConfiguration, this.securityConfiguration);
    this.changedAdvanceConfigEvent.emit({ key: this.securityConfiguration.key, config: change });
  }

  upsertAdvanceConfiguration(array, element) {
    const i = array.findIndex(_element => _element.category === element.category);
    if (i > -1) {
      array[i] = element;
    }
    else {
      array.push(element);
    }
  }

  formStatus(status: boolean) {
    this.formStatusEvent.emit(status);
  }
}

