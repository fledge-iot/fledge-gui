import { Component, Input, OnInit, SimpleChange, ViewChild } from '@angular/core';
import { FormGroup, NgForm, FormControl } from '@angular/forms';
import { AlertService, ConfigurationService } from '../../../../../../services';
import { TreeComponent, ITreeOptions, ITreeState, } from '@circlon/angular-tree-component';
import { sortBy, isEmpty } from 'lodash';
import { map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-add-configure',
  templateUrl: './add-configure.component.html',
  styleUrls: ['./add-configure.component.css'],
})
export class AddConfigureComponent implements OnInit {

  scripts = [];  // list of south services
  selectedConfigItem = ''; // selected list in the dropdown
  configValue = '';
  @Input() controlIndex; // position of the control in the dom
  @Input() step; // type of step
  @Input() config;
  @Input() update = false;

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

  ngOnChanges(simpleChange: SimpleChange) {
    if (!simpleChange['config'].firstChange) {
      this.config = simpleChange['config'].currentValue;
      this.nodes = [];
      this.getCategories();
    }
  }

  ngOnInit(): void { }

  ngAfterViewInit() {
    this.getCategories();
    setTimeout(() => {
      this.stepControlGroup().addControl('configure', new FormGroup({
        category: new FormControl(''),
        item: new FormControl(''),
        value: new FormControl(''),
        condition: new FormGroup({})
      }));
    }, 0);
  }

  stepControlGroup(): FormGroup {
    return this.control.controls[`step-${this.controlIndex}`] as FormGroup;
  }


  scriptControlGroup(): FormGroup {
    return this.stepControlGroup().controls['configure'] as FormGroup;
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
        mergeMap((result) => {
          if (this.config) {
            this.scriptControlGroup().controls['category'].setValue(this.config.value.category);
            this.getCategoryData(this.config.value.category);
          }
          return result;
        }
        )).subscribe(
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
                this.tree.treeModel.update();
              });
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
    this.getCategoryData(event.node.data.id, true);
  }

  private getCategoryData(categoryKey: string, isNodeClicked = false): void {
    const categoryValues = [];
    this.configurationService.getCategory(categoryKey).
      subscribe(
        (data: any) => {
          if (!isEmpty(data)) {
            categoryValues.push(data);
          }
          const configData = { key: categoryKey, value: categoryValues };
          this.parseConfig(configData, isNodeClicked);
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  parseConfig(categoryData: any, isNodeClicked = false) {
    this.configItems = [];
    if (categoryData?.value?.length > 0) {
      this.configItems = categoryData.value.map((el: any) => {
        return Object.keys(el).map((key) => {
          return {
            key,
            data: el[key]
          }
        });
      })[0];

      let item;
      if (isNodeClicked) {
        item = this.configItems[0];
      } else {
        // set category name
        setTimeout(() => {
          const category = this.tree.treeModel.nodes.find(r => {
            if (r.key === this.config.value.category) {
              return r;
            } else {
              r = r.children.find(child => (child.key === this.config.value.category))
              return r;
            }
          });
          if (this.config.value.category === category.key) {
            this.selectedCategory = category.displayName ? category.displayName : category.description;
          } else {

            const cat = category.children.find(child => (child.key === this.config.value.category));
            this.selectedCategory = cat.displayName ? cat.displayName : cat.description;
          }
        }, 1000);
        item = this.configItems.find(c => {
          if (this.config && this.config.value.item === c.key) {
            c.data.value = this.config.value.value;
            return c;
          }
        })
      }
      this.selectedConfigItem = item.data.displayName ? item.data.displayName : item.data.description;
      this.configValue = item.data.value;
      this.scriptControlGroup().controls['item'].setValue(item.key);
      this.scriptControlGroup().controls['value'].setValue(item.data.value);
      return;
    }
    this.selectedConfigItem = '';
    this.configValue = '';
    this.scriptControlGroup().controls['item'].setValue('');
    this.scriptControlGroup().controls['value'].setValue('');

  }

  setItem(config: any) {
    this.selectedConfigItem = config.data.displayName ? config.data.displayName : (config.data.description.length <= 30 ?
      config.data.description : `${config.data.description.slice(0, 30)}...`);
    this.configValue = config.data.value;
    this.scriptControlGroup().controls['item'].setValue(config.key);
    this.scriptControlGroup().controls['value'].setValue(config.data.value);
  }

  setValue(value: any) {
    this.configValue = value;
    this.scriptControlGroup().controls['value'].setValue(value);
  }

}
