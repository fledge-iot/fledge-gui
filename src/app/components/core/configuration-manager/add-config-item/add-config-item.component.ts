import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NgForm } from '@angular/forms';

import { AlertService, ConfigurationService } from '../../../../services';

@Component({
  selector: 'app-add-config-item',
  templateUrl: './add-config-item.component.html',
  styleUrls: ['./add-config-item.component.css']
})
export class AddConfigItemComponent implements OnInit {
  public catName = '';
  public categoryData: any;
  public configItemType = [];
  public configType = 'TEXT';
  public boolValue = true; // default value of select type

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private configService: ConfigurationService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.configItemType = ['boolean', 'integer', 'string', 'IPv4', 'IPv6', 'X509 certificate', 'password', 'JSON'];
    this.categoryData = {
      categoryDescription: '',
      categoryKey: '',
      rootCategory: '',
      configName: '',
      key: '',
      description: '',
      defaultValue: '',
      type: ''
    };
  }

  public setConfigName(desc, key, selectedRootCategory) {
    this.categoryData = {
      categoryDescription: desc,
      categoryKey: key,
      rootCategory: selectedRootCategory
    };
  }

  public toggleModal(isOpen: Boolean, form: NgForm = null) {
    if (form != null) {
      this.resetAddConfigItemForm(form);
    }
    const modal = <HTMLDivElement>document.getElementById('add-config-item');
    if (isOpen) {
      modal.classList.add('is-active');
      return;
    }
    modal.classList.remove('is-active');
  }

  public resetAddConfigItemForm(form: NgForm) {
    form.resetForm();
  }

  public addConfigItem(form: NgForm) {
    console.log('form', form);
    const configItem = form.controls['configName'].value;
    const configItemData = {
      'type': form.controls['type'].value,
      'default': form.controls['defaultValue'].value.toString(),
      'description': form.controls['description'].value
    };
    this.configService
      .addNewConfigItem(
        configItemData,
        this.categoryData.categoryKey,
        configItem
      )
      .subscribe(
        (data) => {
          this.notify.emit(this.categoryData);
          this.toggleModal(false, null);
          this.alertService.success(data['message']);
          if (form != null) {
            this.resetAddConfigItemForm(form);
          }
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        }
      );
  }

  public modelChanged(type) {

    if (type != null) {
      switch (type.toUpperCase()) {
        case 'IPV4':
        case 'IPV6':
        case 'STRING':
        case 'PASSWORD':
          this.configType = 'TEXT';
          break;
        case 'INTEGER':
          this.configType = 'NUMBER';
          break;
        case 'BOOLEAN':
          this.configType = 'BOOLEAN';
          break;
        case 'JSON':
        case 'X509 CERTIFICATE':
          this.configType = 'LONG_TEXT';
          break;
        default:
          break;
      }
    }
  }
}
