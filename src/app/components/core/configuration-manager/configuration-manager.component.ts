import { Component, OnInit, ViewChild } from '@angular/core';
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
  public isChild = true;
  validConfigForm = false;

  nodes: any[] = [];
  options = {};

  @ViewChild(TreeComponent, { static: true }) private tree: TreeComponent;
  changedConfig: any;
  categoryDataCopy: any;

  constructor(private configService: ConfigurationService,
    public rolesService: RolesService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    private configurationControlService: ConfigurationControlService,
    private fileUploaderService: FileUploaderService,
  ) { }

  ngOnInit() {
    this.getTreeStructure();
  }

  public getTreeStructure() {
    /** request started */
    this.ngProgress.start();
    this.configService.getRootCategories().
      subscribe(
        (data: any) => {
          this.categoryData = data.categories;
          // filter south, north & notification categories
          this.categoryData = this.categoryData.filter((n: any) => {
            return !["SOUTH", "NORTH", "NOTIFICATIONS"].includes(n.key.toUpperCase());
          });
          this.nodes = this.updateIdAndNameInTreeObject(this.categoryData)
          /** request completed */
          this.ngProgress.done();
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText, true);
          }
        });
  }

  updateIdAndNameInTreeObject(tree: any) {
    // Iterate through the array
    tree.forEach((node: any) => {
      // add key as Id and displayName/description as a name in the tree object
      node.id = node.key;
      node.name = (node.hasOwnProperty('displayName')) ? node.displayName : node.description;
      node.hasChildren = false;
      // If the object has 'children' property recurse 
      if (Array.isArray(node.children) && node.children.length > 0) {
        node.hasChildren = true;
        this.updateIdAndNameInTreeObject(node.children);
      }
    })
    return tree;
  }

  onTreeLoad(tree: TreeComponent): void {
    const child = tree.treeModel.nodes[0]?.children[0];
    if (child) {
      const firstRootChild = tree.treeModel.getNodeById(child.id);
      firstRootChild.setActiveAndVisible();
      this.getCategory(firstRootChild.data.id, firstRootChild.data.description);
    }
  }

  public onNodeActive(tree: TreeComponent) {
    const rootId = tree.treeModel.focusedNodeId?.toString();
    // In case of root node is in ['Advanced', 'General', 'Utilities'], 
    // Expand the group and select first child
    if (['Advanced', 'General', 'Utilities'].includes(rootId)) {
      if (tree?.treeModel) {
        const nodes = tree.treeModel.nodes;
        const node = nodes.find(c => c.id == rootId)?.children[0];
        const firstChild = tree.treeModel.getNodeById(node.id);
        firstChild.setActiveAndVisible();
        this.getCategory(node.id, node.description);
      }
    } else {
      const child = tree.treeModel.getNodeById(rootId);
      this.getCategory(rootId, child.data.description);
    }
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
            this.alertService.error(error.statusText, true);
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
            this.alertService.error(error.statusText, true);
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
}
