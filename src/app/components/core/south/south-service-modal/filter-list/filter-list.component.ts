import { cloneDeep } from 'lodash';
import { Component, Input, ViewChild } from '@angular/core';
import {
  ConfigurationControlService,
  ConfigurationService,
  FileUploaderService,
  FilterService,
  ResponseHandler,
  RolesService,
  ToastService
} from '../../../../../services';
import { ConfigurationGroupComponent } from '../../../configuration-manager/configuration-group/configuration-group.component';
import { Pipeline } from './pipeline';
import { Service } from '../../south-service';
import { catchError, map } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-filter-list',
  templateUrl: './filter-list.component.html',
  styleUrls: ['./filter-list.component.css']
})
export class FilterListComponent {
  @Input() filterPipeline: Pipeline[] = [];
  changedfilterPipeline: Pipeline[];
  @Input() service: Service;
  validFilterConfigForm = false;

  public selectedFilterPlugin;
  filterConfiguration = new Map();
  filterConfigurationCopy = new Map();

  @ViewChild('filterConfigComponent') filterConfigComponent: ConfigurationGroupComponent;
  changedFilterConfig = new Map();
  filterAPICallsStack = []; // hold all filter API calls to pass in forkJoin

  constructor(
    public rolesService: RolesService,
    private configurationControlService: ConfigurationControlService,
    private configService: ConfigurationService,
    private filterService: FilterService,
    private fileUploaderService: FileUploaderService,
    private response: ResponseHandler,
    private toastService: ToastService) { }


  activeAccordion(id, filterName: string) {
    const last = <HTMLElement>document.getElementsByClassName('accordion card is-active')[0];
    if (last !== undefined) {
      const lastActiveContentBody = <HTMLElement>last.getElementsByClassName('card-content')[0];
      const activeId = last.getAttribute('id');
      lastActiveContentBody.hidden = true;
      last.classList.remove('is-active');
      if (id !== +activeId) {
        const next = <HTMLElement>document.getElementById(id);
        const nextActiveContentBody = <HTMLElement>next.getElementsByClassName('card-content')[0];
        nextActiveContentBody.hidden = false;
        next.setAttribute('class', 'accordion card is-active');
        this.getFilterConfiguration(filterName);
      } else {
        last.classList.remove('is-active');
        lastActiveContentBody.hidden = true;
      }
    } else {
      const element = <HTMLElement>document.getElementById(id);
      const body = <HTMLElement>element.getElementsByClassName('card-content')[0];
      body.hidden = false;
      element.setAttribute('class', 'accordion card is-active');
      this.getFilterConfiguration(filterName);
    }
  }

  onDrop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    moveItemInArray(this.filterPipeline, event.previousIndex, event.currentIndex);
    console.log('filterPipeline', this.filterPipeline);
  }

  getFilterConfiguration(filterName: string) {
    const catName = this.service.name + '_' + filterName;
    this.filterService.getFilterConfiguration(catName)
      .subscribe((data: any) => {
        this.selectedFilterPlugin = data.plugin.value;
        this.filterConfiguration.set(catName, { key: catName, config: data });
        console.log(this.filterConfiguration);
        this.filterConfigurationCopy.set(catName, cloneDeep({ key: catName, config: data }));
        this.filterConfigComponent?.updateCategroyConfig(data);
        this.changedFilterConfig = null;
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  /**
  * Get edited filter configuration from show configuration page
  * @param changedConfiguration changed configuration of a selected filter
  */
  getChangedFilterConfig(changedConfiguration: any, categoryName: string) {
    const changedConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, this.filterConfigurationCopy.get(categoryName));
    this.changedFilterConfig.set(categoryName, changedConfig);
    console.log(this.changedFilterConfig);
  }

  update() {
    if (this.changedFilterConfig.size > 0) {
      this.updateConfiguration(this.changedFilterConfig, 'filter-config');
    }
  }

  updateConfiguration(configurationMap: Map<string, {}>, type: string) {
    configurationMap.forEach((value, key) => {
      const files = this.getScriptFilesToUpload(value);
      if (files.length > 0) {
        this.fileUploaderService.uploadConfigurationScript(key, files);
      }
      this.filterAPICallsStack.push(this.configService.
        updateBulkConfiguration(key, value)
        .pipe(map(() => ({ type, success: true })))
        .pipe(catchError(e => of({ error: e, failed: true }))));
    });

    if (this.filterAPICallsStack.length > 0) {
      forkJoin(this.filterAPICallsStack).subscribe((result) => {
        result.forEach((r: any) => {
          if (r.failed) {
            if (r.error.status === 0) {
              console.log('service down ', r.error);
            } else {
              this.toastService.error(r.error.statusText);
            }
          } else {
            this.response.handleResponseMessage(r.type);
          }
        });
      });
      this.filterAPICallsStack = [];
      this.changedFilterConfig = null;
    }
  }

  /**
   * To upload script files of a configuration property
   * @param categoryName name of the configuration category
   * @param files : Scripts array to uplaod
   */
  public uploadScript(categoryName: string, files: any[]) {
    this.fileUploaderService.uploadConfigurationScript(categoryName, files);
    // if (isEmpty(this.changedConfig) && isEmpty(this.advancedConfiguration)
    //   && isEmpty(this.changedFilterConfig)) {
    //   this.toggleModal(false);
    // }
  }

  /**
   * Get scripts to upload from a configuration item
   * @param configuration  edited configuration from show configuration page
   * @returns script files to upload
   */
  getScriptFilesToUpload(configuration: any) {
    return this.fileUploaderService.getConfigurationPropertyFiles(configuration);
  }
}
