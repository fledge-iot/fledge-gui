import { AfterViewInit, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { AlertService, ConfigurationControlService, ConfigurationService, RolesService } from '../../../../services';
import { DeveloperFeaturesService } from '../../../../services/developer-features.service';
import { chain, cloneDeep, uniqWith } from 'lodash';
import { TabHeader } from './tab-header-slider';
import { TabNavigationComponent } from '../tab-navigation/tab-navigation.component';

@Component({
  selector: 'app-configuration-group',
  templateUrl: './configuration-group.component.html',
  styleUrls: ['./configuration-group.component.css']
})
export class ConfigurationGroupComponent implements AfterViewInit {

  @Input() category: any;
  @Input() plugin: string;
  @Input() serviceStatus = false;
  @Input() from: string;
  @Input() sourceName: string;

  @Output() changedConfigEvent = new EventEmitter<any>();
  @Output() formStatusEvent = new EventEmitter<boolean>();
  @Output() changedAdvanceConfigEvent = new EventEmitter<any>();

  @ViewChild(TabNavigationComponent) tabNavigationComponent: TabNavigationComponent;

  selectedGroup = { key: 'Basic', name: 'Basic' };
  groups = [];
  tabs: TabHeader;

  // To hold the changed configuration values of a plugin
  configFormValues = {};
  pages = ['south', 'north', 'notifications', 'additional-services'];
  categoryKey = '';
  advanceConfiguration: any
  securityConfiguration: any;
  changedAdvanceConfiguration: any;
  changedSecurityConfiguration: any;
  dynamicCategoriesGroup = [];
  groupTabs = [];

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
    let modelConfig = [];
    let listConfig = [];
    let kvlistConfig = [];
    this.groups = [];
    const configItems = Object.keys(this.category.config)
      // remove readonly true config items from the group
      .filter((key: any) => (this.category.config[key].readonly !== 'true'))
      .map(k => {
        this.category.config[k].key = k;
        return this.category.config[k];
      }).filter(obj => !['bucket', 'list', 'kvlist'].includes(obj.type)); // remove type=bucket, type=list and type=kvlist from config array

    this.groups = chain(configItems).groupBy(x => x.group).map((v, k) => {
      const g = k != "undefined" && k?.toLowerCase() != 'basic' ? k : "Basic";
      return { category: this.category.name, group: { key: g, name: g }, config: Object.assign({}, ...v.map(vl => { return { [vl.key]: vl } })), type: g }
    }).value();

    Object.keys(this.category.config).map(k => {
      this.category.config[k].key = k;
      if (this.category.config[k].type == 'bucket') {
        modelConfig.push(this.category.config[k]);
      }
      else if (this.category.config[k].type == 'list') {
        listConfig.push(this.category.config[k]);
      }
      else if (this.category.config[k].type == 'kvlist') {
        kvlistConfig.push(this.category.config[k]);
      }
    })

    if (modelConfig.length > 0) {
      this.buildGroupOfItems(modelConfig);
    }

    if (listConfig.length > 0) {
      this.buildGroupOfItems(listConfig);
    }

    if (kvlistConfig.length > 0) {
      this.buildGroupOfItems(kvlistConfig);
    }

    // merge configuration of same group
    this.groups = uniqWith(this.groups, (pre, cur) => {
      if (pre.group.key == cur.group.key) {
        cur.config = { ...cur.config, ...pre.config };
        return true;
      }
      return false;
    });

    // sort group items having default configuration as first element
    this.groups = this.groups
      .sort((a, b) => {
        return ((+a?.order) - (+b?.order)) || a.group.name.localeCompare(b.group.name)
      }).reduce((acc, e) => {
        e.group.key === 'Basic' ? acc.unshift(e) : acc.push(e);
        return acc;
      }, []);


    this.getGroups();
    // set initial group
    this.selectedGroup = this.groups[0]?.group;
  }

  buildGroupOfItems(configItems) {
    configItems?.forEach(config => {
      if (!config.hasOwnProperty('value')) {
        config.value = config.default;
      }
      let isGroupNameExist = this.groups.some(obj => Object.values(obj.group).includes(config.displayName ? config.displayName : config.key));
      let group = { key: config.key, name: config.displayName ? config.displayName : config.key, description: config.description };
      if (isGroupNameExist) {
        // If same group exist, create new group with coonfig key and the description of the configuration
        group = { key: config.key, name: config.key, description: config.description }
      }

      this.groups.push({ category: this.category.name, group, config: config, type: config.type, key: config.key, ...(config.order && { order: config.order }) });
    });

  }

  /**
   * Set tab in the group
   * @param tab tab index
   */
  selectTab(tab) {
    if (tab.key !== this.selectedGroup.key) {
      this.selectedGroup = tab;
    }
    if (this.tabNavigationComponent) {
      const tabIndex = this.groupTabs.findIndex(t => t.key === this.selectedGroup.key);
      this.tabNavigationComponent.setTab(tabIndex);
    }
  }

  getGroups() {
    this.groupTabs = [...this.groups.map(g => g.group), ...this.dynamicCategoriesGroup.map(g => g.group),];
    if (this.developerFeaturesService.getDeveloperFeatureControl() && this.pages.includes(this.from)) {
      this.groupTabs.push({ key: 'Developer', name: 'Developer' });
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
            cat.group = {
              key: cat.key,
              name: cat?.key.includes(`${this.categoryKey}Advanced`) ? 'Advanced' :
                (cat?.key.includes(`${this.categoryKey}Security`) ? 'Security' : cat?.displayName)
            };
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

  developerTabState(tabs: any) {
    return !tabs.some(d => (d.key == 'Developer'))
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
    dynamicGroups = dynamicGroups.sort((a, b) => a.group.key.localeCompare(b.group.key))
      .reduce((acc, e) => {
        e.group.key === 'Basic' ? acc.unshift(e) : acc.push(e);
        return acc;
      }, []);

    this.getGroups();
    // set advance as a first tab if no default config
    if (this.groups.length == 0) {
      this.selectedGroup = dynamicGroups[0]?.group
    }
  }

  formStatus(formState: any) {
    // find the object of changed form from groups array
    let groupObject = this.groups.find((g: any) => g.group.key === formState.group.key);
    if (!groupObject) {
      groupObject = this.dynamicCategoriesGroup.find((g: any) => g.group.key === formState.group.key)
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

  toggleCard(index) {
    let cardBody = document.getElementById('card-content-' + index);
    let cardSpan = document.getElementById('card-span-' + index);
    let cardIcon = document.getElementById('card-icon-' + index);
    if (cardBody.classList.contains('is-hidden')) {
      cardBody.classList.remove('is-hidden');
      cardSpan.title = 'Collapse';
      cardIcon.classList.remove('fa-chevron-right');
      cardIcon.classList.add('fa-chevron-down');
    }
    else {
      cardBody.classList.add('is-hidden');
      cardSpan.title = 'Expand';
      cardIcon.classList.remove('fa-chevron-down');
      cardIcon.classList.add('fa-chevron-right');
    }
  }
}
