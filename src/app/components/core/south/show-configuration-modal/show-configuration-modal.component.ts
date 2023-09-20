import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  RolesService,
  ConfigurationControlService,
  ConfigurationService,
  FilterService,
  FileUploaderService,
  ToastService
} from '../../../../services';
import { cloneDeep, isEmpty } from 'lodash';

@Component({
  selector: 'app-show-configuration-modal',
  templateUrl: './show-configuration-modal.component.html',
  styleUrls: ['./show-configuration-modal.component.css']
})
export class ShowConfigurationModalComponent implements OnInit {
  categoryName: string = '';
  filterConfiguration;
  filterConfigurationCopy
  changedFilterConfig;

  @Output() changedConfigEvent = new EventEmitter();

  constructor(public rolesService: RolesService,
    private configurationControlService: ConfigurationControlService,
    private configService: ConfigurationService,
    private filterService: FilterService,
    private fileUploaderService: FileUploaderService,
    private toastService: ToastService) { }

  ngOnInit(): void { }

  getFilterConfiguration() {
    const catName = this.categoryName;
    console.log(catName);

    this.filterService.getFilterConfiguration(catName)
      .subscribe((data: any) => {
        this.filterConfiguration = { key: catName, config: data, plugin: data.plugin.value };
        this.filterConfigurationCopy = cloneDeep({ key: catName, config: data, plugin: data.plugin.value });
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }



  public toggleModal(isOpen: Boolean) {
    const modalWindow = <HTMLDivElement>document.getElementById('configuration-modal');
    if (isOpen) {
      this.getFilterConfiguration();
      modalWindow.classList.add('is-active');
      return;
    }
    modalWindow.classList.remove('is-active');
  }

  emitChangedConfig($event) {
    this.changedConfigEvent.emit($event);
  }

}
