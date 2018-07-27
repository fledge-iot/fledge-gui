import { Component, Input, OnInit, Renderer, ViewChild } from '@angular/core';
import _ from 'lodash-es/array';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, ConfigurationService } from '../../../services';
import { AddCategoryChildComponent } from './add-category-child/add-category-child.component';
import { AddConfigItemComponent } from './add-config-item/add-config-item.component';

@Component({
  selector: 'app-configuration-manager',
  templateUrl: './configuration-manager.component.html',
  styleUrls: ['./configuration-manager.component.css']
})
export class ConfigurationManagerComponent implements OnInit {
  public categoryData = [];
  public rootCategories = [];
  public childCategories = [];
  public JSON;
  public addConfigItem: any;
  public selectedRootCategory = 'General';
  element: Element;

  @Input() categoryConfigurationData;
  @ViewChild(AddConfigItemComponent) addConfigItemModal: AddConfigItemComponent;
  @ViewChild(AddCategoryChildComponent) addCategoryChild: AddCategoryChildComponent;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    private renderer: Renderer,
    public ngProgress: NgProgress) {
    this.JSON = JSON;
    this.renderer.listen('document', 'click', (evt) => {
      const i = evt.target.id;
      if (i.indexOf('UKEY-') !== -1) {
        console.log('UKEY-');
        const iconElement = document.getElementById(evt.target.id);
        const childElementPanel = document.getElementById(evt.target.id + '-children');
        const cl = iconElement.getAttribute('class');
        if (cl === 'fa fa-plus-square') {
          iconElement.setAttribute('class', 'fa fa-minus');
          this.getChildren(i.replace('UKEY-', ''), false, i + '-children');
          childElementPanel.classList.remove('child-panel');
          const els = <HTMLCollection>document.getElementsByClassName('cat-desc');
          for (let l = 0; l < els.length; l++) {
            els[l].classList.remove('cat-desc');
          }
        } else {
          iconElement.setAttribute('class', 'fa fa-plus-square');
          childElementPanel.classList.add('child-panel');
        }
      }
      if (i.indexOf('UDESC-') !== -1) {
        const elementId = document.getElementById(evt.target.id);
        const desc = elementId.innerText;
        const els = <HTMLCollection>document.getElementsByClassName('cat-desc');
        for (let l = 0; l < els.length; l++) {
          els[l].classList.remove('cat-desc');
        }
        console.log('UDESC-');
        const selectedElement = <HTMLElement>document.getElementById(i.replace('UDESC-', ''));
        selectedElement.setAttribute('class', 'cat-desc');
        this.getCategory(i.replace('UDESC-', ''), desc);
      }
      if (i.indexOf('ADD-CHILD-') !== -1) {
        console.log('ADD-CHILD-');
        this.addCategoryChild.setCategoryData(i.replace('ADD-CHILD-', ''));
        // call child component method to toggle modal
        this.addCategoryChild.toggleModal(true);
      }
    });
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

  public getChildren(category_name, onLoadingPage = false, appendTo = 'root-children') {
    console.log("onLoadingPage: ", onLoadingPage);
    /** request started */
    this.ngProgress.start();
    this.childCategories = [];
    if (appendTo === 'root-children') {
      this.selectedRootCategory = category_name;
      this.categoryData = [];
    }
    this.configService.getChildren(category_name).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();

          if (data['categories'].length == 0) {
            this.rootCategories.forEach(el => {
              if (el.key === category_name) {
                this.getCategory(el.key, el.description);
                document.getElementById('root-children').innerHTML =
                '<div class="panel-block"><button class="button is-rounded is-small is-fullwidth" disabled>no sub-category</button></div>';
              }
            });
          }
          else {
            data['categories'].forEach(element => {
              this.childCategories.push({ key: element.key, description: element.description });
            });
            
            if (this.childCategories.length) {
              const h = this.getchildCategoriesNodesHtml(this.childCategories);
              document.getElementById(appendTo).innerHTML = h;
              this.getCategory(this.childCategories[0].key, this.childCategories[0].description);
            }
            else {
              this.childCategories = [];
              document.getElementById('root-children').innerHTML =
                '<div class="panel-block"><button class="button is-rounded is-small is-fullwidth" disabled>no sub-category</button></div>';
            }
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

  public resetAllFilters() {
    this.selectedRootCategory = 'General';
    this.getRootCategories(true);
  }

  private getCategory(category_name: string, category_desc: string): void {
    const categoryValues = [];
    this.configService.getCategory(category_name).
      subscribe(
        (data) => {
          categoryValues.push(data);
          this.categoryData = [{ key: category_name, value: categoryValues, description: category_desc }];
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public getchildCategoriesNodesHtml(childCategories) {
    let html = '';
    let counter = 0;
    let selClass = 'cat-desc';
    childCategories.forEach(el => {
      if (counter > 0) {
        selClass = '';
      }
      counter += 1;
      html += '<div class="panel-block" style="display: inherit;" id="root-child">';
      html += '<ul><li id="' + el.key.trim() + '" class="' + selClass + '"><span class="icon">';
      html += '<i id="UKEY-' + el.key.trim() + '" class="fa fa-plus-square" aria-hidden="true"></i>';
      html += '</span>';
      html += '<a class="subtitle is-6" id="UDESC-' + el.key.trim() + '">' + el.description + '</a>';
      html += '</li></ul>';
      html += '<br/><div id="UKEY-' + el.key.trim() + '-children"> </div>';
      html += '<center><button class="button is-text is-small" id="ADD-CHILD-' + el.key.trim() + '"> Add Child</button><center>';
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
  * @param notify
  * To reload categories after adding a new child category
  */
  onAddChild(categoryData) {
    this.getChildren(categoryData['parentCategory'], false, 'UKEY-' + categoryData['parentCategory'] + '-children');
  }

  /**
  * Open add Config Item modal dialog
  */
  openAddConfigItemModal(description, key) {
    this.addConfigItemModal.setConfigName(description, key, this.selectedRootCategory);
    // call child component method to toggle modal
    this.addConfigItemModal.toggleModal(true);
  }
}
