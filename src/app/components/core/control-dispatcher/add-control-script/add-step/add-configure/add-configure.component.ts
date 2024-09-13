import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup, NgForm } from '@angular/forms';
import { ITreeOptions, ITreeState, TreeComponent } from '@ali-hm/angular-tree-component';
import { isEmpty, sortBy } from 'lodash';
import { map, mergeMap } from 'rxjs/operators';
import { AlertService, ConfigurationService, RolesService } from '../../../../../../services';

@Component({
  selector: 'app-add-configure',
  templateUrl: './add-configure.component.html',
  styleUrls: ['./add-configure.component.css'],
})
export class AddConfigureComponent implements OnInit {

  scripts = [];  // list of south services
  selectedConfigItem = ''; // selected list in the dropdown
  configValue = '';
  config;

  @Input() controlIndex; // position of the control in the dom
  @Input() step; // type of step
  @Input() update = false;

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
    public rolesService: RolesService,
    private control: NgForm) { }

  ngOnChanges() {
    this.config = this.control.value['steps'][`step-${this.controlIndex}`]['configure'];
    this.getCategories();
    this.setOrder();
  }

  ngOnInit(): void { }

  stepsFormGroup() {
    return this.control.form.controls['steps'] as UntypedFormGroup;
  }

  stepControlGroup(): UntypedFormGroup {
    return this.stepsFormGroup()?.controls[`step-${this.controlIndex}`] as UntypedFormGroup;
  }

  configureControlGroup() {
    return this.stepControlGroup()?.controls['configure'] as UntypedFormGroup;
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
          if (this.config.category) {
            this.configureControlGroup().controls['category'].patchValue(this.config.category);
            this.getCategoryData(this.config.category);
          }
          return result;
        }
        )
      ).subscribe(
        (category: any) => {
          this.updateIdAndNameInTreeObject(category);
          this.nodes.push(category);
          this.nodes = sortBy(this.nodes, (ca: any) => {
            return ca.name;
          });
          this.tree.treeModel.update();
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  updateIdAndNameInTreeObject(category) {
    category.id = category.key;
    category.name = (category.hasOwnProperty('displayName')) ? category.displayName : category.description;
    // If the object has 'children' property recurse 
    if (Array.isArray(category.children) && category.children.length > 0) {
      category.children.forEach(c => this.updateIdAndNameInTreeObject(c));
    }
  }

  public onNodeActive(event: any) {
    this.config.category = event.node.data.displayName;
    this.configureControlGroup().controls['category'].patchValue(event.node.data.key);
    this.configureControlGroup().markAsTouched();
    this.configureControlGroup().markAsDirty();
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
            if (r.key === this.config.category) {
              return r;
            } else {
              r = r.children.find(child => (child.key === this.config.category))
              return r;
            }
          });

          if (this.config.category === category.key) {
            this.config.category = category.displayName ? category.displayName : category.description;
          } else {

            const cat = category.children.find(child => (child.key === this.config.category));
            this.config.category = cat.displayName ? cat.displayName : cat.description;
          }
        }, 1000);
        item = this.configItems.find(c => {
          if (this.config && this.config.item === c.key) {
            c.data.value = this.config.value;
            return c;
          }
        })
      }
      this.selectedConfigItem = item.data.displayName ? item.data.displayName : item.data.description;
      this.configValue = item.data.value;
      this.configureControlGroup().controls['item'].setValue(item.key);
      this.configureControlGroup().controls['value'].setValue(item.data.value);
      return;
    }
    this.selectedConfigItem = '';
    this.configValue = '';
    this.configureControlGroup()?.controls['item'].setValue('');
    this.configureControlGroup()?.controls['value'].setValue('');

  }

  setItem(config: any) {
    this.selectedConfigItem = config.data.displayName ? config.data.displayName : (config.data.description.length <= 30 ?
      config.data.description : `${config.data.description.slice(0, 30)}...`);
    this.configValue = config.data.value;
    this.configureControlGroup().controls['item'].setValue(config.key);
    this.configureControlGroup().controls['value'].setValue(config.data.value);
    this.configureControlGroup().markAsTouched();
    this.configureControlGroup().markAsDirty();
  }

  setValue(value: any) {
    this.configValue = value;
    this.configureControlGroup().controls['value'].setValue(value);
    this.configureControlGroup().markAsTouched();
    this.configureControlGroup().markAsDirty();
  }

  setOrder() {
    this.configureControlGroup().controls['order'].patchValue(this.controlIndex);
  }

}
