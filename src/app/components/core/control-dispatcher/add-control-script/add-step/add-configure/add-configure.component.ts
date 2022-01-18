import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup, NgForm, FormControl, ControlContainer } from '@angular/forms';
import { AlertService, ConfigurationService } from '../../../../../../services';
import { TreeComponent, ITreeOptions, ITreeState } from '@circlon/angular-tree-component';
import { sortBy, isEmpty } from 'lodash';
import { map, mergeMap } from 'rxjs/operators';


@Component({
  selector: 'app-add-configure',
  templateUrl: './add-configure.component.html',
  styleUrls: ['./add-configure.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class AddConfigureComponent implements OnInit {

  scripts = [];  // list of south services
  selectedConfigItem = ''; // selected list in the dropdown
  configValue = '';
  @Input() controlIndex; // position of the control in the dom
  @Input() step; // type of step
  @Input() config;


  stepsGroup: FormGroup;

  values = [];

  public selectedCategory = '';
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
    private alertService: AlertService,
    private configurationService: ConfigurationService,
    private control: NgForm) { }

  ngOnInit(): void { }

  ngAfterViewInit() {
    this.getCategories();
    setTimeout(() => {
      this.stepsGroup = this.control.controls[`step-${this.controlIndex}`] as FormGroup;
      this.stepsGroup.addControl('configure', new FormGroup({
        category: new FormControl(''),
        item: new FormControl(''),
        value: new FormControl(''),
        condition: new FormGroup({})
      }));
    }, 0);
  }

  scriptControlGroup(): FormGroup {
    return this.stepsGroup.controls['configure'] as FormGroup;
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

  public getCategories() {
    this.configurationService.getRootCategories().
      pipe(
        map((data: any) => data.categories),
        mergeMap(result => result)).subscribe(
          (category: any) => {
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

                if (this.config && this.config.key === this.step) {
                  this.setCategory(this.config.value.category);
                }
                this.tree.treeModel.update();
              })
          },
          error => {
            if (error.status === 0) {
              console.log('service down ', error);
            } else {
              this.alertService.error(error.statusText);
            }
          });
  }

  public onNodeActive(event: any) {
    this.selectedCategory = event.node.data.displayName;
    this.scriptControlGroup().controls['category'].setValue(event.node.data.key);
    this.getCategoryData(event.node.data.id, event.node.data.description);
  }

  setCategory(id) {
    if (this.tree.treeModel.getNodeById(id)) {
      const node = this.tree.treeModel.getNodeById(id);
      this.selectedCategory = node.data.displayName;
      this.scriptControlGroup().controls['category'].setValue(node.data.key);
      this.getCategoryData(node.data.id, node.data.description);
      this.setValue(this.config.value.value);
    }
  }

  private getCategoryData(categoryKey: string, categoryDesc: string): void {
    const categoryValues = [];
    this.configurationService.getCategory(categoryKey).
      subscribe(
        (data: any) => {
          if (!isEmpty(data)) {
            categoryValues.push(data);
          }
          const categoryData = { key: categoryKey, value: categoryValues, description: categoryDesc };
          this.parseConfig(categoryData);
        },
        error => {
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
      })[0];
      if (this.config && this.config.key === this.step) {
        const item = this.configItems.find(c => c.key === this.config.value.item);
        this.selectedConfigItem = item.data.displayName;
        this.scriptControlGroup().controls['item'].setValue(item.key);
      } else {
        this.selectedConfigItem = this.configItems[0].data.displayName;
        this.scriptControlGroup().controls['item'].setValue(this.configItems[0].key);
      }
    }
  }


  setItem(config: any) {
    this.selectedConfigItem = config.data.displayName;
    this.scriptControlGroup().controls['item'].setValue(config.key);
  }

  setValue(value: any) {
    this.configValue = value;
    this.scriptControlGroup().controls['value'].setValue(value);
  }

}
