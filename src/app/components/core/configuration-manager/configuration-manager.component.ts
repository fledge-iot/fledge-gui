import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { TreeComponent } from 'angular-tree-component';
import { isEmpty } from 'lodash-es/';
import _ from 'lodash-es/array';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, ConfigurationService } from '../../../services';

@Component({
  selector: 'app-configuration-manager',
  templateUrl: './configuration-manager.component.html',
  styleUrls: ['./configuration-manager.component.css']
})
export class ConfigurationManagerComponent implements OnInit {
  public categoryData = [];
  public rootCategories = [];
  public JSON;
  public selectedRootCategory = 'General';
  public isChild = true;

  @Input() categoryConfigurationData;
  nodes: any[] = [];
  options = {};

  @ViewChild(TreeComponent)
  private tree: TreeComponent;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    public ngProgress: NgProgress) {
    this.JSON = JSON;
  }

  ngOnInit() {
    this.getRootCategories(true);
  }

  public getRootCategories(onLoadingPage = false) {
    this.rootCategories = [];
    this.configService.getRootCategories().
      subscribe(
        (data) => {
          data['categories'].forEach(element => {
            this.rootCategories.push({ key: element.key, description: element.description });
            this.rootCategories = this.rootCategories.filter(el => el.key.toUpperCase() !== 'SOUTH');
            this.rootCategories = this.rootCategories.filter(el => el.key.toUpperCase() !== 'NORTH');
          });
          if (onLoadingPage === true) {
            this.getChildren(this.selectedRootCategory);
          }
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public getChildren(categoryName) {
    /** request started */
    this.ngProgress.start();
    this.selectedRootCategory = categoryName;
    this.tree.treeModel.nodes = [];

    this.nodes = [];
    this.configService.getChildren(categoryName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          const rootCategories = this.rootCategories.filter(el => el.key === categoryName);

          // Check if there is any category
          if (rootCategories.length > 0 && data['categories'].length === 0) {
            this.isChild = false;
            this.getCategory(rootCategories[0].key, rootCategories[0].description);
            this.categoryData = [];
            return;
          }
          this.isChild = true;
          data['categories'].forEach(element => {
            this.nodes.push({ id: element.key, name: element.description, hasChildren: true, children: [] });
          });

          this.tree.treeModel.update();
          if (this.tree.treeModel.getFirstRoot()) {
            this.tree.treeModel.getFirstRoot().setIsActive(true);
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

  public onNodeToggleExpanded(event) {
    event.node.data.children = [];
    if (event.node.isExpanded) {
      this.configService.getChildren(event.node.data.id).
        subscribe(
          (data) => {
            data['categories'].forEach(element => {
              event.node.data.children.push({ id: element.key, name: element.description, hasChildren: true, children: [] });
              this.tree.treeModel.update();
            });
          }, error => {
            if (error.status === 0) {
              console.log('service down ', error);
            } else {
              this.alertService.error(error.statusText);
            }
          });
    }
  }

  public onNodeActive(event) {
    this.getCategory(event.node.data.id, event.node.data.name);
  }

  public resetAllFilters() {
    this.selectedRootCategory = 'General';
    this.getRootCategories(true);
  }

  private getCategory(category_name: string, category_desc: string): void {
    /** request started */
    this.ngProgress.start();
    const categoryValues = [];
    this.configService.getCategory(category_name).
      subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          if (!isEmpty(data)) {
            categoryValues.push(data);
            this.categoryData = [{ key: category_name, value: categoryValues, description: category_desc }];
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

  public refreshCategory(category_name: string, category_desc: string): void {
    /** request started */
    this.ngProgress.start();
    const categoryValues = [];
    this.configService.getCategory(category_name).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          categoryValues.push(data);
          const index = _.findIndex(this.categoryData, ['key', category_name]);
          this.categoryData[index] = { key: category_name, value: categoryValues, description: category_desc };
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

  /**
  * @param notify
  * To reload categories after adding a new config item for a category
  */
  onNotify(categoryData) {
    this.selectedRootCategory = categoryData.rootCategory;
    this.getRootCategories();
    this.refreshCategory(categoryData.categoryKey, categoryData.categoryDescription);
  }
}
