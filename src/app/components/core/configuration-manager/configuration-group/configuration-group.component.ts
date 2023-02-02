import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlertService, ConfigurationControlService, ConfigurationService, RolesService } from '../../../../services';
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

  pages = ['south', 'north', 'notification'];
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
    private alertService: AlertService
  ) { }

  ngOnInit() { }

  ngOnChanges() {
    this.categeryConfiguration();
    this.getChildConfigData();
  }

  public updateCategroyConfig(config) {
    this.category.config = config;
    this.categeryConfiguration();
    this.getChildConfigData();
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

    // sort group items having default configuration as first element
    this.groups = this.groups
      .sort((a, b) => a.group.localeCompare(b.group))
      .reduce((acc, e) => {
        e.group === 'Default Configuration' ? acc.unshift(e) : acc.push(e);
        return acc;
      }, []);
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
    if (this.pages.includes(this.from) && this.category) {
      this.categoryKey = this.category.name;
      this.getCategoryConfigChildren(this.category.name)
    }
  }

  getCategoryConfigChildren(categoryName: string) {
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
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
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
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        }
      );
  }


  /**
   * Get the change config item values form show-child
   * component and emit that value to parent component.
   * @param values config item updated values
   */
  getChangedConfiguration(values: {}) {
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

  /**
   * To update the values in the already existed group those are holding advance &
   * security configuration, after fetching configuration from API
   * @param groups configuration groups
   * @param config advance cofiguration
   */
  upsertAdvanceConfiguration(groups, config) {
    const i = groups.findIndex(_config => _config.category === config.category);
    if (i > -1) {
      groups[i] = config;
    }
    else {
      groups.push(config);
    }
  }

  formStatus(status: boolean) {
    this.formStatusEvent.emit(status);
  }
}

