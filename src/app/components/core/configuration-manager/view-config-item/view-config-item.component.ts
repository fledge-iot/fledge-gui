import { Component, Input, OnInit } from '@angular/core';
import { ConfigurationService, AlertService } from '../../../../services';
import { NgProgress } from '../../../../../../node_modules/ngx-progressbar';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-view-config-item',
  templateUrl: './view-config-item.component.html',
  styleUrls: ['./view-config-item.component.css']
})
export class ViewConfigItemComponent implements OnInit {
  @Input() categoryConfigurationData: any;
  public oldValue;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    public ngProgress: NgProgress) { }

  ngOnInit() { }

  public restoreConfigFieldValue(configItemKey, categoryKey, form: NgForm) {
    const itemKey = categoryKey.toLowerCase() + '-' + configItemKey.toLowerCase();
    if (this.oldValue !== undefined) {
      form.controls[itemKey].setValue(this.oldValue);
    }
    const cancelButton = <HTMLButtonElement>document.getElementById('btn-cancel-' + itemKey);
    cancelButton.classList.remove('active');
    cancelButton.classList.add('hidden');
  }

  public saveConfigValue(categoryName, configItem, type, form: NgForm) {
    const catItemId = categoryName + '-' + configItem;
    // const cancelButton = <HTMLButtonElement>document.getElementById('btn-cancel-' + id);
    // cancelButton.classList.add('hidden');

    console.log('form value ', form.controls[catItemId.toLowerCase()].value);
    const value = form.controls[catItemId.toLowerCase()].value;

    /** request started */
    this.ngProgress.start();
    this.configService.saveConfigItem(categoryName, configItem, value, type).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          if (data['value'] !== undefined) {
            if (type.toUpperCase() === 'JSON') {
              form.controls[catItemId.toLowerCase()].setValue(JSON.stringify(data['value']));
            } else {
              form.controls[catItemId.toLowerCase()].setValue(data['value']);
            }
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

  public getConfigAttributeType(key) {
    let type = '';
    switch (key.trim().toUpperCase()) {
      case 'STRING':
      case 'IPV4':
      case 'IPV6':
      case 'X509 CERTIFICATE':
      case 'PASSWORD':
        type = 'TEXT';
        break;
      case 'INTEGER':
        type = 'NUMBER';
        break;
      case 'BOOLEAN':
        type = 'BOOLEAN';
        break;
      case 'JSON':
      case 'X509 CERTIFICATE':
        type = 'LONG_TEXT';
        break;
      default:
        break;
    }
    return type;
  }

  onModelChange(oldVal) {
    if (oldVal !== undefined) {
      this.oldValue = oldVal;
    }
  }

  public onTextChange(configItemKey: string, form: NgForm) {
    // const previousCancelButton = <HTMLButtonElement>document.getElementsByClassName('active')[0];
    // if (previousCancelButton !== undefined) {
    //   previousCancelButton.classList.remove('active');
    //   previousCancelButton.classList.add('hidden');
    //   console.log(form.value);
    //   if (this.oldValue !== undefined) {
    //     form.controls[configItemKey.toLowerCase()].setValue(this.oldValue);
    //   }
    // }


    const cancelButton = <HTMLButtonElement>document.getElementById('btn-cancel-' + configItemKey.toLowerCase());
    cancelButton.classList.add('active');
    cancelButton.classList.remove('hidden');
  }
}
