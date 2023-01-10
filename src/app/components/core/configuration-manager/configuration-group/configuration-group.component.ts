import { Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { ConfigurationService, RolesService } from '../../../../services';
import { DeveloperFeaturesService } from '../../../../services/developer-features.service';
import { chain } from 'lodash';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConfigurationControlService, ShowConfigurationComponent } from '../show-configuration/show-configuration.component';

@Component({
  selector: 'app-configuration-group',
  templateUrl: './configuration-group.component.html',
  styleUrls: ['./configuration-group.component.css']
})
export class ConfigurationGroupComponent implements OnInit {

  seletedTab = 'Default Configuration';
  @Input() category;
  groups = [];
  @Input() pageId;

  @Output() changedConfigEvent = new EventEmitter<any>();

  configFormValues = {};
  constructor(
    private configService: ConfigurationControlService,
    public developerFeaturesService: DeveloperFeaturesService,
    public rolesService: RolesService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
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

    // console.log('groups', this.groups);

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

  show(values: {}) {
    console.log('v', values);
    this.configFormValues = Object.assign({}, this.configFormValues, values);
    console.log('configView', this.configFormValues);
    this.changedConfigEvent.emit(this.configFormValues)
  }
}

