import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { TreeComponent } from '@circlon/angular-tree-component';
import { isEmpty, cloneDeep } from 'lodash';

import {
  AlertService, ConfigurationControlService, ConfigurationService,
  FileUploaderService, ProgressBarService, RolesService
} from '../../../services';

@Component({
  selector: 'app-configuration-manager',
  templateUrl: './configuration-manager.component.html',
  styleUrls: ['./configuration-manager.component.css']
})

export class ConfigurationManagerComponent implements OnInit {
  public categoryData = [];
  public JSON;
  public isChild = true;
  validConfigForm = false;

  nodes: any[] = [];
  options = {};

  @ViewChild(TreeComponent, { static: true })
  private tree: TreeComponent;
  changedConfig: any;
  categoryDataCopy: any;

  constructor(private configService: ConfigurationService,
    public rolesService: RolesService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    private configurationControlService: ConfigurationControlService,
    private fileUploaderService: FileUploaderService
  ) {
    this.JSON = JSON;
  }

  ngOnInit() {
    this.getTreeStructure();
  }

  public getTreeStructure() {
    /** request started */
    this.ngProgress.start();
    this.tree.treeModel.nodes = [];

    this.nodes = [];
    this.configService.getRootCategories().
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();

          // Check if there is any category
          if (data['categories'].length === 0) {
            this.isChild = false;
            this.categoryData = [];
            return;
          }
          this.isChild = true;
          data['categories'].forEach(element => {
            this.nodes.push({
              id: element.key,
              name: (element.hasOwnProperty('displayName')) ? element.displayName : element.description,
              description: element.description,
              hasChildren: (element.children.length) > 0 ? true : false , children: this.addNameKey(element.children)
            });
          });

          // If category 'General' exists, show it on index 0
          this.nodes.forEach((_n, i) => {
            if (this.nodes[i]['id'] === 'General') {
              const node = this.nodes.splice(i, 1);
              this.nodes.unshift(node[0]);
            }
          });

          const firstChild = this.nodes[0]['children'][0];
          
          this.getCategory(firstChild.key, firstChild.description);
          
          this.tree.treeModel.update();
          if (this.tree.treeModel.getFirstRoot()) {          
            const firstRootChild = this.tree.treeModel.getNodeById(firstChild.id);
            firstRootChild.setActiveAndVisible();
          }
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  addNameKey(childrenData) {
    Object.keys(childrenData).forEach((i) => {
      childrenData[i]['name'] = childrenData[i]['displayName'];
      childrenData[i]['id'] = childrenData[i]['key'];
      delete childrenData[i]['displayName'];
      if (childrenData[i]['children']) {
        this.addNameKey(childrenData[i]['children']);
      }  
    });
    return childrenData;
  }

  public onNodeActive(event) {
    this.getCategory(event.node.data.id, event.node.data.description);
  }

  private getCategory(categoryKey: string, categoryDesc: string): void {
    /** request started */
    this.ngProgress.start();
    this.configService.getCategory(categoryKey).
      subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          if (!isEmpty(data)) {
            this.categoryData = [{ name: categoryKey, config: data, description: categoryDesc }];
            this.categoryDataCopy = cloneDeep(this.categoryData);
          }
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public refreshCategory(categoryKey: string, categoryDesc: string): void {
    this.changedConfig = null;
    this.validConfigForm = false;
    this.getCategory(categoryKey, categoryDesc);
  }

  /**
   * Get edited south service configuration from show configuration page
   * @param changedConfiguration changed configuration of a selected plugin
   */
  getChangedConfig(changedConfiguration: any, category: any) {
    const cat = this.categoryDataCopy.find(cat => cat.key === category.key);
    this.changedConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, cat);
  }

  save(catName: string, catDesc: string) {
    if (!isEmpty(this.changedConfig)) {
      this.updateConfiguration(catName, catDesc, this.changedConfig);
    }
  }

  /**
  * Update configuration
  * @param categoryName Name of the cateogry
  * @param categoryDescription Description of the cateogry
  * @param configuration category updated configuration
  */
  updateConfiguration(categoryName: string, categoryDescription: string, configuration: any) {
    const files = this.getScriptFilesToUpload(configuration);
    if (files.length > 0) {
      this.uploadScript(categoryName, files);
    }

    if (!categoryName || isEmpty(configuration)) {
      return;
    }
    this.ngProgress.start();
    this.configService.
      updateBulkConfiguration(categoryName, configuration)
      .subscribe(() => {
        this.changedConfig = null;
        this.validConfigForm = false;
        this.alertService.success('Configuration updated successfully.', true);
        this.ngProgress.done();
        this.getCategory(categoryName, categoryDescription);
      },
        (error) => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  /**
   * Get scripts to upload from a configuration item
   * @param configuration  edited configuration from show configuration page
   * @returns script files to upload
   */
  getScriptFilesToUpload(configuration: any) {
    return this.fileUploaderService.getConfigurationPropertyFiles(configuration);
  }

  /**
   * To upload script files of a configuration property
   * @param categoryName name of the configuration category
   * @param files : Scripts array to uplaod
   */
  public uploadScript(categoryName: string, files: any[]) {
    this.fileUploaderService.uploadConfigurationScript(categoryName, files);
  }


  /**
   * Check if object has a specific key
   * @param o Object
   * @param name key name
   */
  public hasProperty(o, name) {
    return o.hasOwnProperty(name);
  }
}
