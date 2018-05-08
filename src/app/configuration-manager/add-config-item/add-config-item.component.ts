import { Component, OnInit, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { NgForm, FormGroup } from '@angular/forms';
import { ConfigurationService, AlertService } from '../../services/index';

@Component({
  selector: 'app-add-config-item',
  templateUrl: './add-config-item.component.html',
  styleUrls: ['./add-config-item.component.css']
})
export class AddConfigItemComponent implements OnInit {
  public catName = '';
  public categoryData: any;
  configItemType = [];

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(private configService: ConfigurationService, private alertService: AlertService) { }

  ngOnInit() {
    this.configItemType = ['boolean', 'integer', 'string', 'IPv4', 'IPv6', 'X509 certificate', 'password', 'JSON'];
    this.categoryData = {
      categoryDescription: '',
      categoryKey: '',
      configName: '',
      key: '',
      description: '',
      defaultValue: '',
      type: ''
    };
  }

  public setConfigName(desc, key) {
    this.categoryData = {
      categoryDescription: desc,
      categoryKey: key
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
    const configItem = form.controls['configName'].value;
    const configItemData = {
      'type': form.controls['type'].value,
      'default': form.controls['defaultValue'].value,
      'description': form.controls['description'].value
    };
    this.configService.addNewConfigItem(configItemData, this.categoryData.categoryKey, configItem).
      subscribe(
        data => {
          this.notify.emit();
          this.toggleModal(false, null);
          this.alertService.success(data.message);
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
        });
  }
}
