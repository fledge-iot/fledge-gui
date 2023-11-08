import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { AlertService, ConfigurationControlService, ConfigurationService, RolesService } from '../../../../services';
import { DeveloperFeaturesService } from '../../../../services/developer-features.service';
import { chain, cloneDeep, uniqWith } from 'lodash';
import { TabHeader } from './tab-header-slider';

@Component({
  selector: 'app-configuration-group',
  templateUrl: './configuration-group.component.html',
  styleUrls: ['./configuration-group.component.css']
})
export class ConfigurationGroupComponent implements AfterViewInit {

  selectedGroup = 'Basic';
  @Input() category;
  groups = [];

  tabs: TabHeader;

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
  dynamicCategoriesGroup = [];

  constructor(
    public developerFeaturesService: DeveloperFeaturesService,
    public rolesService: RolesService,
    private configService: ConfigurationService,
    private configurationControlService: ConfigurationControlService,
    private alertService: AlertService
  ) { }

  ngAfterViewInit() {
    const groupNavContents = document.getElementById("groupNavContents");
    this.tabs = new TabHeader(groupNavContents);
    window.addEventListener('resize', () => {
      this.tabs.setOverFlow();
    })
  }

  // left slider click
  left() {
    this.tabs.scrollToLeft();
  }

  // right slider click
  right() {
    this.tabs.scrollToRight();
  }

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
    if (this.category) {
      this.category.config['model'] = {
        "description": "The machine learning model to use inspect the captured image for defects",
        "displayName": "QA Model",
        "order": "2",
        "type": "bucket",
        "properties": {
          "constant": { "type": "MLModel", "name": "BadBottle" },
          "key": {
            "product": {
              "description": "The bottle type being produced",
              "displayName": "Bottle Type",
              "type": "enumeration",
              "options": [
                "Wine Bottle",
                "Bear Bottle",
                "Whiskey Bottle",
                "Milk Bottle"
              ],
              "default": "Milk Bottle"
            },
            "Object_Name": {
              "description": "The demo model version to use, 0 represents the latest version",
              "displayName": "Object Name",
              "type": "string",
              "default": "Glass"
            },
          },
          "properties": {
            "version": {
              "description": "The model version to use, 0 represents the latest version",
              "displayName": "Version",
              "type": "string",
              "default": "1.0.0"
            },
            "Modal": {
              "description": "The dumy modal",
              "displayName": "Demo Modal",
              "type": "enumeration",
              "default": "Bear Bottle",
              "options": [
                "Wine Bottle",
                "Bear Bottle",
                "Whiskey Bottle",
                "Milk Bottle"
              ]

            }
          }
        },
        "default": {
          "type": "MLModel",
          "name": "BadBottle",
          "product": "Wine Bottle",
          "version": "0"
        },
        "value": {
          "type": "MLModel",
          "name": "BadBottle",
          "product": "Wine Bottle",
          "version": "0"
        }
      }
    }

    const modelConfig = this.category.config['model']

    delete this.category.config['model'];

    // console.log('modelConfig', modelConfig);
    this.groups = [];
    const configItems = Object.keys(this.category.config).map(k => {

      this.category.config[k].key = k;
      return this.category.config[k];
    }).filter(obj => !obj.readonly); // remove readonly items from config array

    this.groups = chain(configItems).groupBy(x => x.group).map((v, k) => {
      const g = k != "undefined" && k?.toLowerCase() != 'basic' ? k : "Basic";
      return { category: this.category.name, group: g, config: Object.assign({}, ...v.map(vl => { return { [vl.key]: vl } })) }
    }).value();

    // this.groups.push({ category: 'test', group: 'QA Model', config: modelConfig.properties })
    // console.log(this.groups);

    // merge configuration of same group
    this.groups = uniqWith(this.groups, (pre, cur) => {
      if (pre.group == cur.group) {
        cur.config = { ...cur.config, ...pre.config };
        return true;
      }
      return false;
    });

    // sort group items having default configuration as first element
    this.groups = this.groups
      .sort((a, b) => a.group.localeCompare(b.group))
      .reduce((acc, e) => {
        e.group === 'Basic' ? acc.unshift(e) : acc.push(e);
        return acc;
      }, []);

    // set initial group
    this.selectedGroup = this.groups[0]?.group;
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
    this.dynamicCategoriesGroup = [];
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
          this.dynamicCategoriesGroup = [];
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
          this.upsertAdvanceConfiguration(this.dynamicCategoriesGroup, { category: category.key, group: category.group, config: data });
          // check overflow after loading advanced & security group
          setTimeout(() => {
            this.tabs.setOverFlow();
          }, 1);
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
   * @param dynamicGroups configuration groups
   * @param config advance cofiguration
   */
  upsertAdvanceConfiguration(dynamicGroups, config) {
    const i = dynamicGroups.findIndex(_config => _config.category === config.category);
    if (i > -1) {
      dynamicGroups[i] = config;
    }
    else {
      dynamicGroups.push(config);
    }

    dynamicGroups = dynamicGroups.sort((a, b) => a.group.localeCompare(b.group))
      .reduce((acc, e) => {
        e.group === 'Basic' ? acc.unshift(e) : acc.push(e);
        return acc;
      }, []);

    // set advance as a first tab if no default config
    if (this.groups.length == 0) {
      this.selectedGroup = dynamicGroups[0]?.group
    }
  }

  formStatus(formState: any) {
    // find the object of changed form from groups array
    let groupObject = this.groups.find((g: any) => g.group === formState.group);
    if (!groupObject) {
      groupObject = this.dynamicCategoriesGroup.find((g: any) => g.group === formState.group)
    }
    // Set the status of respected tab
    if (groupObject) {
      groupObject.status = formState.status;
    }

    const groupTabFormsStatus = this.groups.concat(this.dynamicCategoriesGroup);
    // check the condition for every element to see if all groups have valid status
    const formStatus = groupTabFormsStatus.every(g => (g.status === true || g.status === undefined));
    this.formStatusEvent.emit(formStatus);
  }
}
