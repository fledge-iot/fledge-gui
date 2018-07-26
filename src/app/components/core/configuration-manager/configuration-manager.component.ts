import { Component, OnInit, ViewChild, Renderer, AfterViewInit } from '@angular/core';
import { ConfigurationService, AlertService } from '../../../services/index';
import { NgProgress } from 'ngx-progressbar';
import { AddConfigItemComponent } from './add-config-item/add-config-item.component';
import { AddCategoryChildComponent } from './add-category-child/add-category-child.component';
import _ from 'lodash-es/array';

@Component({
  selector: 'app-configuration-manager',
  templateUrl: './configuration-manager.component.html',
  styleUrls: ['./configuration-manager.component.css']
})
export class ConfigurationManagerComponent implements OnInit, AfterViewInit {
  public categoryData = [];
  public rootCategories = [];
  public childCategories = [];
  public JSON;
  public addConfigItem: any;
  public selectedRootCategory = 'General';
  public selectedChildIndex = [];
  public nestedChildren = [];
  htmlData;
  element: Element;

  @ViewChild(AddConfigItemComponent) addConfigItemModal: AddConfigItemComponent;
  @ViewChild(AddCategoryChildComponent) addCategoryChild: AddCategoryChildComponent;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    private renderer: Renderer,
    public ngProgress: NgProgress) {
    this.JSON = JSON;
    this.renderer.listen('document', 'click', (evt) => {
      console.log('Clicking the button', evt.target.id);

      const i = evt.target.id;
      if (i.indexOf('UKEY-') !== -1) {
        this.getChildren(i.replace('UKEY-', ''), false, i + '-children');
      }
      if (i.indexOf('UDESC-') !== -1) {
        const desc = document.getElementById(evt.target.id).innerText;
        this.getCategory(i.replace('UDESC-', ''), desc);
      }
      if (i.indexOf('ADD-CHILD-') !== -1) {
        // alert('add a child for:  ' + i.replace('ADD-CHILD-', ''));
        this.addCategoryChild.setCategoryData(i.replace('ADD-CHILD-', ''));
        // call child component method to toggle modal
        this.addCategoryChild.toggleModal(true);
      }
    });
  }

  ngOnInit() {
    this.getRootCategories(true);
  }

  ngAfterViewInit() {
  }

  public getRootCategories(onLoadingPage = false) {
    this.rootCategories = [];
    this.configService.getRootCategories().
      subscribe(
        (data) => {
          data['categories'].forEach(element => {
            this.rootCategories.push({ key: element.key });
          });
          if (onLoadingPage === true) {
            this.getChildren(this.selectedRootCategory, true);
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

  public getChildren(category_name, onLoadingPage = false, appendTo = 'x') {
    /** request started */
    this.ngProgress.start();
    this.childCategories = [];
    if (appendTo === 'x') {
      this.selectedRootCategory = category_name;
      this.categoryData = [];
    }
    this.configService.getChildren(category_name).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          console.log('data1111', data['categories']);
          data['categories'].forEach(element => {
            this.childCategories.push({ key: element.key, description: element.description, is_selected: false });
          });
          if (onLoadingPage === true) {
            this.childCategories[0].is_selected = true;
            this.getCategory(this.childCategories[0].key, this.childCategories[0].description);
          }
          if (this.childCategories.length) {
            const h = this.get_child_html(this.childCategories);
            document.getElementById(appendTo).innerHTML = h;
          }
          console.log('childCategories', this.childCategories);
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

  private getCategory(category_name: string, category_desc: string): void {
    const categoryValues = [];
    this.configService.getCategory(category_name).
      subscribe(
        (data) => {
          categoryValues.push(data);
          this.categoryData.push({ key: category_name, value: categoryValues, description: category_desc });
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public get_child_html(c) {
    let html = '';
    c.forEach(el => {
      html += '<div class="panel-block" style="display: inherit;" id="root-child">';
      html += '<ul><li><span class="icon">';
      html += '<i id="UKEY-' + el.key.trim() + '" class="fa fa-plus-square" aria-hidden="true"></i>';
      html += '</span>';
      html += '<a class="subtitle is-6" id="UDESC-' + el.key.trim() + '">' + el.description + '</a>';
      html += '</li></ul>';
      html += '<br/><div id="UKEY-' + el.key.trim() + '-children"> </div>';
      html += '<button class="panel-block" id="ADD-CHILD-' + el.key.trim() + '"> Add Child</button>';
      html += '</div>';
    });
    return html;
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

  public getSelectedIndex(index, key) {
    this.selectedChildIndex.push(index);
    for (let i = 0; i < this.childCategories.length; i++) {
      if (this.childCategories[i].key === key) {
        this.childCategories[i].is_selected = !(this.childCategories[i].is_selected);
      }
    }
  }

  public restoreConfigFieldValue(config_item_key: string) {
    const inputField = <HTMLInputElement>document.getElementById(config_item_key.toLowerCase());
    inputField.value = inputField.textContent;
    const cancelButton = <HTMLButtonElement>document.getElementById('btn-cancel-' + config_item_key.toLowerCase());
    cancelButton.classList.add('hidden');
  }

  public saveConfigValue(category_name: string, config_item: string, type: string) {
    const cat_item_id = (category_name.trim() + '-' + config_item.trim()).toLowerCase();
    const inputField = <HTMLInputElement>document.getElementById(cat_item_id);
    const value = inputField.value.trim();
    const id = inputField.id.trim();
    const cancelButton = <HTMLButtonElement>document.getElementById('btn-cancel-' + id);
    cancelButton.classList.add('hidden');

    /** request started */
    this.ngProgress.start();
    this.configService.saveConfigItem(category_name, config_item, value, type).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          if (data['value'] !== undefined) {
            inputField.textContent = inputField.value = data['value'];
            this.alertService.success('Value updated successfully');
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

  /**
  * @param notify
  * To reload categories after adding a new config item for a category
  */
  onNotify(categoryData) {
    this.selectedRootCategory = categoryData.rootCategory;
    this.getRootCategories();
    this.refreshCategory(categoryData.categoryKey, categoryData.categoryDescription);
  }

  /**
  * Open add Config Item modal dialog
  */
  openAddConfigItemModal(description, key) {
    this.addConfigItemModal.setConfigName(description, key, this.selectedRootCategory);
    // call child component method to toggle modal
    this.addConfigItemModal.toggleModal(true);
  }

  public onTextChange(config_item_key: string) {
    const cancelButton = <HTMLButtonElement>document.getElementById('btn-cancel-' + config_item_key.toLowerCase());
    cancelButton.classList.remove('hidden');
  }

  isObject(val) { return typeof val === 'object'; }
}
