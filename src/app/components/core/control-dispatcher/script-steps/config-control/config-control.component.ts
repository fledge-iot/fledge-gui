import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { TreeComponent } from '@circlon/angular-tree-component';
import { isEmpty, findIndex, cloneDeep, sortBy } from 'lodash';
import { forkJoin } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import {
  AlertService,
  ConfigurationService,
  ProgressBarService
} from '../../../../../services';

@Component({
  selector: 'app-config-control',
  templateUrl: './config-control.component.html',
  styleUrls: ['./config-control.component.css']
})
export class ConfigControlComponent implements OnInit {
  @Input() config: any;
  public categoryData;
  // public rootCategories = [];
  // public JSON;
  // public selectedRootCategory = 'General';
  // public isChild = true;


  configItems: any;
  nodes = [];
  options = {};

  @ViewChild(TreeComponent, { static: true })
  private tree: TreeComponent;

  constructor(
    private configurationService: ConfigurationService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService
  ) { }

  ngOnInit(): void {
    this.getCategories();
  }

  public getCategories() {
    this.ngProgress.start();
    this.configurationService.getRootCategories().
      pipe(
        map((data: any) => data.categories),
        mergeMap(result => result)).subscribe(
          (category: any) => {
            this.ngProgress.done();
            this.configurationService.getChildren(category.key)
              .subscribe((data: any) => {
                category.id = category.key;
                category.name = category.displayName;
                category.children = data.categories.map(c => {
                  c.id = c.key;
                  c.name = c.displayName;
                  return c;
                });
                this.nodes.push(category);
                this.nodes = sortBy(this.nodes, (ca: any) => {
                  return ca.name;
                });
                this.tree.treeModel.update();
                if (this.tree.treeModel.getFirstRoot()) {
                  this.tree.treeModel.getFirstRoot().setIsActive(true);
                }
              })
          },
          error => {
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
      this.configurationService.getChildren(event.node.data.id).
        subscribe(
          (data) => {
            data['categories'].forEach(element => {
              if (element.hasOwnProperty('displayName')) {
                event.node.data.children.push({
                  id: element.key,
                  name: element.displayName,
                  description: element.description,
                  hasChildren: true,
                  children: []
                });
              } else {
                event.node.data.children.push({
                  id: element.key,
                  name: element.description,
                  description: element.description,
                  hasChildren: true,
                  children: []
                });
              }
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

  parseConfig() {
    if (!isEmpty(this.categoryData)) {
      let categoryConfiguration = cloneDeep(this.categoryData);
      this.configItems = categoryConfiguration.value.map((el: any) => {
        return Object.keys(el).map((key) => {
          return {
            key,
            data: el[key]
          }
        });
      })[0];
    }
  }

  public onNodeActive(event) {
    this.getCategoryData(event.node.data.id, event.node.data.description);
    this.toggleCategoryDropDown()
  }

  public toggleDropDown() {
    const dropDown = document.querySelector('#config-dropdown');
    dropDown.classList.toggle('is-active');
  }

  public toggleCategoryDropDown() {
    const dropDown = document.querySelector('#category-dropdown');
    dropDown.classList.toggle('is-active');
  }

  public resetAllFilters() {
    // this.selectedRootCategory = 'General';
    this.getCategories();
  }

  private getCategoryData(categoryKey: string, categoryDesc: string): void {
    /** request started */
    this.ngProgress.start();
    const categoryValues = [];
    this.configurationService.getCategory(categoryKey).
      subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          if (!isEmpty(data)) {
            categoryValues.push(data);
            this.categoryData = { key: categoryKey, value: categoryValues, description: categoryDesc };
            this.parseConfig();
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
    /** request started */
    this.ngProgress.start();
    const categoryValues = [];
    this.configurationService.getCategory(categoryKey).
      subscribe(
        (data) => {
          console.log('ddd', data);
          console.log('desc', categoryDesc);
          /** request completed */
          this.ngProgress.done();
          // categoryValues.push(data);
          // const index = findIndex(this.categoryData, ['key', categoryKey]);
          // this.categoryData[index] = { key: categoryKey, value: categoryValues, description: categoryDesc };
          // this.parseConfig();
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

  chooseConfigItem(configuration: any) {
    console.log(configuration);
    this.config.value = configuration.data.value;
    this.toggleDropDown()
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
