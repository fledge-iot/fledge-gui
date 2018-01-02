import { Component, OnInit, Input } from '@angular/core';
import { ConfigurationService, AlertService } from '../services/index';
import { NgProgress } from 'ngx-progressbar';

@Component({
  selector: 'app-configuration-manager',
  templateUrl: './configuration-manager.component.html',
  styleUrls: ['./configuration-manager.component.css']
})
export class ConfigurationManagerComponent implements OnInit {
  public categoryData = [];
  constructor(private configService: ConfigurationService, private alertService: AlertService, public ngProgress: NgProgress) { }
  ngOnInit() {
    this.getCategories();
  }

  public getCategories(): void {
    /** request started */
    this.ngProgress.start();
    this.configService.getCategories().
      subscribe(
      data => {
        /** request completed */
        this.ngProgress.done();
        console.log('This is the congfigurationData ', data.categories);
        data.categories.forEach(element => {
          this.getCategory(element.key, element.description);
        });
      },
      error => {
        console.log('error in response', error);
        /** request completed */
        this.ngProgress.done();
        if (error.status === 0) {
          this.alertService.error("Service is down.");
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  private getCategory(category_name: string, category_desc: string): void {
    let categoryValues = [];
    this.configService.getCategory(category_name).
      subscribe(
      data => {
        categoryValues.push(data);
        this.categoryData.push({ key: category_name, value: categoryValues, description: category_desc });
        console.log('This is the categoryData ', this.categoryData);
      },
      error => {
        console.log('error in response', error);
        if (error.status === 0) {
          this.alertService.error("Service is down.");
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  public restoreConfigFieldValue(config_item_key: string, flag: boolean) {
    let inputField = <HTMLInputElement>document.getElementById(config_item_key);
    inputField.value = inputField.textContent;
    let cancelButton = <HTMLButtonElement>document.getElementById('btn-cancel-' + config_item_key);
    cancelButton.disabled = !flag;
  }

  public saveConfigValue(category_name: string, config_item: string, flag: boolean) {
    let inputField = <HTMLInputElement>document.getElementById(config_item);
    let value = inputField.value;
    let id = inputField.id;
    let cancelButton = <HTMLButtonElement>document.getElementById('btn-cancel-' + id);
    cancelButton.disabled = flag;
    this.configService.editConfigItem(category_name, config_item, value).
      subscribe(
      data => {
        this.alertService.success('Value updated successfully');
        inputField.textContent = inputField.value = data.value;
      },
      error => {
        console.log('error in response', error);
        if (error.status === 0) {
          this.alertService.error("Service is down.");
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  public onTextChange(config_item_key: string, flag: boolean) {
    let cancelButton = <HTMLButtonElement>document.getElementById('btn-cancel-' + config_item_key);
    cancelButton.disabled = !flag;
  }
}
