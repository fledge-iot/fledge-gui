import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, ConfigurationService } from '../../../services';
import { AddConfigItemComponent } from './add-config-item/add-config-item.component';
import _ from 'lodash-es/array';

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
  public selectedChildIndex = [];

  public isCategoryData = false;
  @Input() categoryConfigurationData;
  @ViewChild(AddConfigItemComponent) addConfigItemModal: AddConfigItemComponent;

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

  public getChildren(category_name, onLoadingPage = false) {
    /** request started */
    this.ngProgress.start();
    this.childCategories = [];
    this.categoryData = [];
    this.selectedRootCategory = category_name;
    this.configService.getChildren(category_name).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();

          if (data['categories'].length == 0) {
            this.rootCategories.forEach(el => {
              if (el.key === category_name) {
                this.getCategory(el.key, el.description);
              }
            });
          }
          else {
            data['categories'].forEach(element => {
              this.childCategories.push({ key: element.key, description: element.description, is_selected: 'false' });
            });

            if (onLoadingPage === true) {
              this.childCategories[0].is_selected = 'true';
              this.getCategory(this.childCategories[0].key, this.childCategories[0].description);
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

  private getCategory(category_name: string, category_desc: string, event = null): void {
    if (event != null && event.target.checked === false) {
      this.categoryData = this.categoryData.filter(value => value.key !== category_name);
      return;
    }
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

  public isChildSelected(index) {
    if (this.selectedChildIndex === [] && index === 0) {
      return true;
    }
    this.selectedChildIndex.forEach(element => {
      if (element === index) {
        return true;
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
}
