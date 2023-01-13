import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RolesService } from '../../../../services';
import { DeveloperFeaturesService } from '../../../../services/developer-features.service';
import { chain } from 'lodash';

@Component({
  selector: 'app-configuration-group',
  templateUrl: './configuration-group.component.html',
  styleUrls: ['./configuration-group.component.css']
})
export class ConfigurationGroupComponent implements OnInit {

  selectedGroup = 'Default Configuration';
  @Input() category;
  groups = [];
  @Input() pageId;

  @Output() changedConfigEvent = new EventEmitter<any>();
  @Output() formStatusEvent = new EventEmitter<boolean>();

  configFormValues = {};
  constructor(
    public developerFeaturesService: DeveloperFeaturesService,
    public rolesService: RolesService,
  ) { }

  ngOnInit() {
    console.log('configuration category', this.category);
    this.categeryConfiguration();
  }

  categeryConfiguration() {
    const configItems = Object.keys(this.category.config).map(k => {
      this.category.config[k].key = k;
      return this.category.config[k];
    });

    this.groups = chain(configItems).groupBy(x => x.group).map((v, k) => {
      if (k != "undefined") {
        return { category: this.category.name, group: k, config: Object.assign({}, ...v.map(vl => { return { [vl.key]: vl } })) }
      } else {
        // return { group: "Default", values: v }
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

  getChangeConfiguration(values: {}) {
    this.configFormValues = Object.assign({}, this.configFormValues, values);
    this.changedConfigEvent.emit(this.configFormValues)
  }

  formStatus(status: boolean) {
    this.formStatusEvent.emit(status);
  }
}

