import { cloneDeep, isEmpty } from 'lodash';
import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import {
  ConfigurationControlService,
  ConfigurationService,
  FileUploaderService,
  FilterService,
  ResponseHandler,
  RolesService,
  ToastService,
} from '../../../../services';
import { ConfigurationGroupComponent } from '../../configuration-manager/configuration-group/configuration-group.component';
import { catchError, map } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DocService } from '../../../../services/doc.service';

@Component({
  selector: 'app-filter-list',
  templateUrl: './filter-list.component.html',
  styleUrls: ['./filter-list.component.css']
})
export class FilterListComponent {

  @ViewChild('filterConfigComponent') filterConfigComponent: ConfigurationGroupComponent;

  @Input() filterPipeline: string[] = [];
  @Input() service: string = '';
  @Input() from: string = '';
  @Input() sourceName: string;
  @Input() newAddedFilters: { filter: string, state: string }[] = [];
  @Output() formStatus = new EventEmitter<boolean>();
  @Output() controlPipelineFilters = new EventEmitter<string[]>();

  filterPipelineCopy: string[];
  validFilterConfigForm = false;

  filterConfiguration = new Map();
  filterConfigurationCopy = new Map();

  changedFilterConfig = new Map();
  filterAPICallsStack = []; // hold all filter API calls to pass in forkJoin
  deletedFilterPipeline: string[] = [];

  constructor(
    public rolesService: RolesService,
    private configurationControlService: ConfigurationControlService,
    private configService: ConfigurationService,
    private filterService: FilterService,
    private fileUploaderService: FileUploaderService,
    private response: ResponseHandler,
    private docService: DocService,
    private toastService: ToastService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes?.filterPipeline?.currentValue.length > 0) {
      this.filterPipelineCopy = cloneDeep(changes?.filterPipeline.currentValue) // make a copy of the filter pipeline to verify the order of items in pipeline
      this.filterPipeline.forEach(filter => {
        this.getFilterConfiguration(filter);
      })
    }
    if (changes?.newAddedFilters?.currentValue) {
      this.newAddedFilters.forEach(f => {
        this.getFilterConfiguration(f.filter);
      })
    }
  }

  activeAccordion(id: string) {
    const last = <HTMLElement>document.getElementsByClassName('accordion card is-active')[0];
    if (last !== undefined) {
      const lastActiveContentBody = <HTMLElement>last.getElementsByClassName('card-content')[0];
      const activeId = last.getAttribute('id');
      lastActiveContentBody.hidden = true;
      last.classList.remove('is-active');
      if (id !== activeId) {
        const next = <HTMLElement>document.getElementById(id);
        const nextActiveContentBody = <HTMLElement>next.getElementsByClassName('card-content')[0];
        nextActiveContentBody.hidden = false;
        next.setAttribute('class', 'accordion card is-active');
      } else {
        last.classList.remove('is-active');
        lastActiveContentBody.hidden = true;
      }
    } else {
      const element = <HTMLElement>document.getElementById(id);
      const body = <HTMLElement>element.getElementsByClassName('card-content')[0];
      body.hidden = false;
      element.setAttribute('class', 'accordion card is-active');
    }
  }

  onDrop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    moveItemInArray(this.filterPipeline, event.previousIndex, event.currentIndex);
    this.formStatus.emit(this.checkPipelineItemsOrder());
  }

  hasFilter(filter: string) {
    return this.filterConfiguration.has(this.getFilterName(filter));
  }

  getFilter(filter: string) {
    return this.filterConfiguration.get(this.getFilterName(filter));
  }

  getFilterName(filter: string) {
    let filterName = `${this.service}_${filter}`
    if (this.from == 'control-pipeline') {
      filterName = this.newAddedFilters.some(f => f.filter === filter) ? filter : `ctrl_${this.service}_${filter}`
    }
    return filterName;
  }

  getFilterConfiguration(filterName: string) {
    let catName = this.getFilterName(filterName);
    this.filterService.getFilterConfiguration(catName)
      .subscribe((data: any) => {
        this.filterConfiguration.set(catName, { key: catName, config: data, plugin: data.plugin.value });
        this.filterConfigurationCopy.set(catName, cloneDeep({ key: catName, config: data, plugin: data.plugin.value }));
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
  getChangedFilterConfig(changedConfiguration: any, filter: string) {
    const filterName = this.getFilterName(filter);
    const changedConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, this.filterConfigurationCopy.get(filterName));
    if (changedConfig) {
      this.changedFilterConfig.set(filterName, changedConfig);
      const values = this.changedFilterConfig.get(filterName);
      if (isEmpty(values)) {
        this.changedFilterConfig.delete(filterName);
      }
      if (this.changedFilterConfig.size == 0) {
        this.formStatus.emit(false);
        return;
      }
      this.formStatus.emit(true);
    }
  }

  discard() {
    this.deletedFilterPipeline = [];
    this.changedFilterConfig = new Map();
    this.filterPipeline = cloneDeep(this.filterPipelineCopy);
    this.formStatus.emit(false);
  }

  update() {
    if (this.changedFilterConfig?.size > 0) {
      this.updateConfiguration(this.changedFilterConfig, 'filter-config');
    }

    if (this.from !== 'control-pipeline') {
      if (this.checkPipelineItemsOrder() && this.deletedFilterPipeline.length === 0) {
        this.updateFilterPipeline(this.filterPipeline);
      }
      if (this.deletedFilterPipeline.length > 0) {
        this.deleteFilter();
      }
    } else {
      if (this.deletedFilterPipeline.length > 0) {
        this.controlPipelineFilters.emit(this.filterPipeline);
      }
    }
    this.formStatus.emit(false);
  }

  public updateFilterPipeline(filterPipeline) {
    this.filterService.updateFilterPipeline({ 'pipeline': filterPipeline }, this.service)
      .subscribe((data: any) => {
        this.toastService.success(data.result);
      },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  checkPipelineItemsOrder() {
    // Check if both arrays have the same length
    if (this.filterPipeline.length !== this.filterPipelineCopy.length) {
      return true;
    }

    for (let i = 0; i < this.filterPipelineCopy.length; i++) {
      // Check if the item exists in a different position in the second array
      if (this.filterPipeline[i] !== this.filterPipelineCopy[i]) {
        return true;
      }
    }
    // All items have the same counterparts in different positions
    return false;
  }

  deleteFilterReference(filter: string) {
    this.deletedFilterPipeline.push(filter);
    this.filterPipeline = this.filterPipeline.filter(f => f !== filter);
    this.controlPipelineFilters.emit(this.filterPipeline);
    this.formStatus.emit(true);
  }

  deleteFilter() {
    this.filterService.updateFilterPipeline({ 'pipeline': this.filterPipeline }, this.service)
      .subscribe(() => {
        this.deletedFilterPipeline.forEach((filter, index) => {
          this.filterService.deleteFilter(filter).subscribe((data: any) => {
            if (this.deletedFilterPipeline.length === index + 1) {
              this.deletedFilterPipeline = []; // clear deleted filter reference
            }
            this.toastService.success(data.result);
          },
            (error) => {
              if (error.status === 0) {
                console.log('service down ', error);
              } else {
                this.toastService.error(error.statusText);
              }
            });
        });
      },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  updateConfiguration(configurationMap: Map<string, {}>, type: string) {
    configurationMap.forEach((value, key) => {
      const files = this.getScriptFilesToUpload(value);
      if (files.length > 0) {
        this.fileUploaderService.uploadConfigurationScript(key, files);
      }

      if (isEmpty(value)) {
        return;
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
        this.filterAPICallsStack = [];
        this.changedFilterConfig = new Map();
      });
    }
  }

  /**
   * To upload script files of a configuration property
   * @param categoryName name of the configuration category
   * @param files : Scripts array to uplaod
   */
  public uploadScript(categoryName: string, files: any[]) {
    this.fileUploaderService.uploadConfigurationScript(categoryName, files);
  }

  /**
   * Get scripts to upload from a configuration item
   * @param configuration  edited configuration from show configuration page
   * @returns script files to upload
   */
  getScriptFilesToUpload(configuration: any) {
    return this.fileUploaderService.getConfigurationPropertyFiles(configuration);
  }

  goToLink(pluginInfo: string) {
    this.docService.goToPluginLink(pluginInfo);
  }
}
