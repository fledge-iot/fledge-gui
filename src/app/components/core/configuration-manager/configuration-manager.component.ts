import { Component, OnInit, ViewChild } from '@angular/core';
import { ConfigurationService, AlertService } from '../../../services/index';
import { NgProgress } from 'ngx-progressbar';
import { AddConfigItemComponent } from './add-config-item/add-config-item.component';

@Component({
  selector: 'app-configuration-manager',
  templateUrl: './configuration-manager.component.html',
  styleUrls: ['./configuration-manager.component.css']
})
export class ConfigurationManagerComponent implements OnInit {
  public categoryData = [];
  public JSON;
  public addConfigItem: any;
  public isCategoryData = false;

  @ViewChild(AddConfigItemComponent) addConfigItemModal: AddConfigItemComponent;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    public ngProgress: NgProgress) {
    this.JSON = JSON;
  }

  ngOnInit() {
    this.getCategories();
    this.isCategoryData = true;
  }

  public getCategories(): void {
    if (this.isCategoryData === true) {
      this.categoryData = [];
    }
    /** request started */
    this.ngProgress.start();
    this.configService.getCategories().
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          data['categories'].forEach(element => {
            this.getCategory(element.key, element.description);
          });
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
  onNotify() {
    this.getCategories();
  }

  /**
  * Open add Config Item modal dialog
  */
  openAddConfigItemModal(description, key) {
    this.addConfigItemModal.setConfigName(description, key);
    // call child component method to toggle modal
    this.addConfigItemModal.toggleModal(true);
  }

  public onTextChange(config_item_key: string) {
    const cancelButton = <HTMLButtonElement>document.getElementById('btn-cancel-' + config_item_key.toLowerCase());
    cancelButton.classList.remove('hidden');
  }

  isObject(val) { return typeof val === 'object'; }
}
