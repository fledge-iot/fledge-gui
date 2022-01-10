import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { TreeComponent, ITreeOptions, ITreeState } from '@circlon/angular-tree-component';
import { isEmpty, sortBy } from 'lodash';
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

  public selectedCategory = 'General';
  state: ITreeState;
  configItems: any;
  nodes = [];
  options: ITreeOptions = {
    displayField: 'name',
    isExpandedField: 'expanded',
    hasChildrenField: 'nodes',
    nodeHeight: 23,
    levelPadding: 10,
    animateExpand: true,
    animateSpeed: 30,
    animateAcceleration: 1.2,
  }

  @ViewChild(TreeComponent, { static: true })
  private tree: TreeComponent;

  constructor(
    private configurationService: ConfigurationService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService
  ) { }

  ngOnInit(): void {
    this.selectedCategory = this.config?.category;
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
                if (this.tree.treeModel.getNodeById(this.selectedCategory)) {
                  this.tree.treeModel.getNodeById(this.selectedCategory).setActiveAndVisible(true);
                } else {
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

  public onNodeActive(event: any) {
    this.config.category = event.node.data.displayName;
    this.getCategoryData(event.node.data.id, event.node.data.description);
  }

  public toggleDropDown(id: string) {
    const dropdowns = document.getElementsByClassName('dropdown');
    for (let i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('is-active')) {
        openDropdown.classList.toggle('is-active', false);
      } else {
        if (openDropdown.id === id) {
          openDropdown.classList.toggle('is-active');
        }
      }
    }
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
          }
          const categoryData = { key: categoryKey, value: categoryValues, description: categoryDesc };
          this.parseConfig(categoryData);

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

  parseConfig(categoryData: any) {
    if (categoryData?.value?.length > 0) {
      this.configItems = categoryData.value.map((el: any) => {
        return Object.keys(el).map((key) => {
          return {
            key,
            data: el[key]
          }
        });
        // set changed config item and value
      })[0];
      this.config.item = this.configItems[0].key;
      this.config.value = this.configItems[0].data.value
    } else {
      // reset
      this.config.item = '';
      this.config.value = '';
    }
  }

  chooseConfigItem(configuration: any) {
    this.config.item = configuration.key;
    this.config.value = configuration.data.value;
  }

}
