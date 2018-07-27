import { Component, Input, OnInit } from '@angular/core';
import { ConfigurationService, AlertService } from '../../../../services';
import { NgProgress } from '../../../../../../node_modules/ngx-progressbar';

@Component({
  selector: 'app-view-config-item',
  templateUrl: './view-config-item.component.html',
  styleUrls: ['./view-config-item.component.css']
})
export class ViewConfigItemComponent implements OnInit {
  @Input() categoryConfigurationData: any;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    public ngProgress: NgProgress) { }

  ngOnInit() { }

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

  public onTextChange(config_item_key: string) {
    const cancelButton = <HTMLButtonElement>document.getElementById('btn-cancel-' + config_item_key.toLowerCase());
    cancelButton.classList.remove('hidden');
  }
}
