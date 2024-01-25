import { Component, ElementRef, EventEmitter, HostListener, Injector, OnInit, ViewChild } from '@angular/core';
import { createEditor, getUpdatedFilterPipeline, deleteConnection } from './editor';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigurationControlService, ConfigurationService, FileUploaderService, FilterService, ResponseHandler, ServicesApiService, ToastService } from './../../../services';
import { catchError, map, skip, takeUntil } from 'rxjs/operators';
import { Service } from '../../core/south/south-service';
import { Subject, Subscription, forkJoin, of } from 'rxjs';
import { FlowEditorService } from './flow-editor.service';
import { cloneDeep, isEmpty } from 'lodash';
import { FilterListComponent } from '../../core/filter/filter-list/filter-list.component';

@Component({
  selector: 'app-node-editor',
  templateUrl: './node-editor.component.html',
  styleUrls: ['./node-editor.component.css']
})
export class NodeEditorComponent implements OnInit {

  @ViewChild("rete") container!: ElementRef;
  public source = '';
  public filterPipeline = [];
  public updatedFilterPipeline = [];
  public filterConfigurations: any[] = [];
  public category: any;
  private subscription: Subscription;
  private filterSubscription: Subscription;
  private connectionSubscription: Subscription;

  showPluginConfiguration: boolean = false;
  showFilterConfiguration: boolean = false;
  showLogs: boolean = false;
  service: Service;
  services: Service[];
  destroy$: Subject<boolean> = new Subject<boolean>();
  serviceName = '';
  filterName = '';
  isfilterPipelineFetched = false;
  selectedConnectionId = "";
  changedConfig: any;
  pluginConfiguration;
  advancedConfiguration = [];
  public unsavedChangesInFilterForm = false;
  public reenableButton = new EventEmitter<boolean>(false);
  apiCallsStack = [];
  validConfigurationForm = true;
  @ViewChild('filtersListComponent') filtersListComponent: FilterListComponent;

  constructor(public injector: Injector,
    private route: ActivatedRoute,
    private filterService: FilterService,
    private servicesApiService: ServicesApiService,
    private configService: ConfigurationService,
    public flowEditorService: FlowEditorService,
    private configurationControlService: ConfigurationControlService,
    private fileUploaderService: FileUploaderService,
    private toastService: ToastService,
    private response: ResponseHandler,
    private router: Router) {
    this.route.queryParams.subscribe(params => {
      if (params['source']) {
        this.source = params['source'];
        this.getSouthboundServices();
        if(this.source !== "nodelist"){
          this.getFilterPipeline();
        }
      }
    });
  }

  @HostListener('document:keydown.delete', ['$event']) onKeydownHandler() {
    this.deleteSelectedConnection();
  }
  @HostListener('click')
  onClick() {
    this.flowEditorService.canvasClick.next({canvasClicked: true,  connectionId: this.selectedConnectionId});
  }
  ngOnInit(): void {
    this.subscription = this.flowEditorService.showItemsInQuickview.pipe(skip(1)).subscribe(data => {
      this.showPluginConfiguration = data.showPluginConfiguration;
      this.showFilterConfiguration = data.showFilterConfiguration;
      this.showLogs = data.showLogs;
      this.serviceName = data.serviceName;
      if(this.showPluginConfiguration){
        this.unsavedChangesInFilterForm = false;
        this.getCategory();
      }
      if(this.showLogs){
        this.unsavedChangesInFilterForm = false;
      }
    })
    this.filterSubscription = this.flowEditorService.filterInfo.subscribe(data => {
      if (data.name !== "newPipelineFilter") {
        this.filterName = data.name;
        for (let i = 0; i < this.filterPipeline.length; i++) {
          if (typeof (this.filterPipeline[i]) === "string") {
            if (this.filterPipeline[i] === this.filterName) {
              this.filterPipeline = this.filterPipeline.filter(f => f !== this.filterName);
              this.deleteFilter();
              break;
            }
          }
          else {
            if (this.filterPipeline[i].indexOf(this.filterName) !== -1) {
              this.filterPipeline[i] = this.filterPipeline[i].filter(f => f !== this.filterName);
              if (this.filterPipeline[i].length === 0) {
                this.filterPipeline.splice(i, 1);
              }
              this.deleteFilter();
              break;
            }
          }
        }
        console.log(this.filterPipeline);
      }
      else {
        if(this.isfilterPipelineFetched){
          let updatedPipeline = getUpdatedFilterPipeline();
          if (updatedPipeline && updatedPipeline.length > 0) {
            this.updatedFilterPipeline = updatedPipeline;
            console.log(this.updatedFilterPipeline);
            this.flowEditorService.pipelineInfo.next(this.updatedFilterPipeline);
            this.router.navigate(['/south', this.source, 'details'], { queryParams: { source: 'flowEditorFilter' } });
          }
        }
      }
    })
    this.connectionSubscription = this.flowEditorService.connectionInfo.subscribe(data => {
      if(data.selected){
        this.selectedConnectionId = data.id;
      }
      else{
        this.selectedConnectionId = "";
      }
    })
  }

  ngAfterViewInit(): void {
    const el = this.container.nativeElement;

    if (el) {
      setTimeout(() => {
        createEditor(el, this.injector, this.source, this.filterPipeline, this.service, this.services, this.filterConfigurations);
      }, 3000);
    }
  }

  getFilterPipeline() {
    this.filterService.getFilterPipeline(this.source)
      .subscribe((data: any) => {
        this.filterPipeline = data.result.pipeline as string[];
        // this.filterPipeline = ["rename2", ["meta2", "change2", "delta2"], "fft2", ["exp2"], ["asset2", "log2"]];
        this.isfilterPipelineFetched = true;
        this.createFilterConfigurationsArray();
      },
        error => {
          if (error.status === 404) {
            this.filterPipeline = [];
            this.isfilterPipelineFetched = true;
          } else {
            console.log('Error ', error);
          }
        });
  }

  getSouthboundServices() {
    this.servicesApiService.getSouthServices(true)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any) => {
          const services = data.services as Service[];
          this.services = services;
          this.service = services.find(service => (service.name == this.source));
        },
        error => {
          console.log('service down ', error);
        });
  }

  public getCategory(): void {
    /** request started */
    this.configService.getCategory(this.serviceName).
      subscribe(
        (data) => {
          this.changedConfig = [];
          this.advancedConfiguration = [];
          this.category = { name: this.serviceName, config: data };
          this.pluginConfiguration = cloneDeep({ name: this.service.name, config: data });
        },
        error => {
          console.log('service down ', error);
        }
      );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.filterSubscription.unsubscribe();
    this.connectionSubscription.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  getFilterConfiguration(filterName: string) {
    let catName = `${this.source}_${filterName}`
    this.filterService.getFilterConfiguration(catName)
      .subscribe((data: any) => {
        if (data) {
          let filterConfig = {pluginName: data.plugin.value, enabled: data.enable.value, filterName: filterName, color: "#F9CB9C"};
          this.filterConfigurations.push(filterConfig);
        }
      },
        error => {
          console.log('service down ', error);
        });
  }

  createFilterConfigurationsArray(){
    let flattenedFilterPipeline = [].concat(...this.filterPipeline)
    flattenedFilterPipeline.forEach((filterName)=>{
      this.getFilterConfiguration(filterName)
    })
  }

  deleteFilter() {
    this.filterService.updateFilterPipeline({ 'pipeline': this.filterPipeline }, this.source)
      .subscribe(() => {
        this.filterService.deleteFilter(this.filterName).subscribe(() => {
          console.log(this.filterName + " filter deleted");
          setTimeout(() => {
            this.router.navigate(['/south/flow'], { queryParams: { source: this.source } });
          }, 1000);
        },
          (error) => {
            console.log('service down ', error);
          });
      },
        (error) => {
          console.log('service down ', error);
        });
  }

  save() {
    let updatedPipeline = getUpdatedFilterPipeline();
    if(updatedPipeline && updatedPipeline.length > 0){
      this.updatedFilterPipeline = updatedPipeline;
      if(this.isPipelineUpdated() && this.isEachFilterConfigured()){
        // console.log("pipeline updated")
        this.updateFilterPipeline();
        console.log(this.updatedFilterPipeline);
      }
    }
  }

  updateFilterPipeline() {
    this.filterService.updateFilterPipeline({ 'pipeline': this.updatedFilterPipeline }, this.source)
      .subscribe(() => {
        console.log("pipeline updated");
        setTimeout(() => {
          this.router.navigate(['/south/flow'], { queryParams: { source: this.source } });
        }, 1000);
      },
        (error) => {
          console.log('service down ', error);
        });
  }

  isPipelineUpdated(){
    if(this.filterPipeline.length !== this.updatedFilterPipeline.length){
      return true;
    }
    for(let i=0; i<this.filterPipeline.length; i++){
      if(typeof(this.filterPipeline[i]) !== typeof(this.updatedFilterPipeline[i])){
        return true;
      }
      if(typeof(this.filterPipeline[i]) === "string"){
        if(this.filterPipeline[i] !== this.updatedFilterPipeline[i]){
          return true;
        }
      }
      else{
        if(this.filterPipeline[i].length !== this.updatedFilterPipeline[i].length){
          return true;
        }
        for(let j=0; j<this.filterPipeline[i].length; j++){
          if(this.filterPipeline[i][j] !== this.updatedFilterPipeline[i][j]){
            return true;
          }
        }
      }
    }
    return false;
  }

  deleteSelectedConnection(){
    if(this.selectedConnectionId){
      deleteConnection(this.selectedConnectionId);
    }
  }

  isEachFilterConfigured() {
    for(let i=0; i<this.updatedFilterPipeline.length; i++){
      if(typeof(this.updatedFilterPipeline[i]) === "string"){
        if(this.updatedFilterPipeline[i] === "Filter"){
          console.log("filter configuration not added");
          return false;
        }
      }
      else {
        if(this.updatedFilterPipeline[i].indexOf("Filter") !== -1){
          console.log("filter configuration not added");
          return false;
        }
      }
    }
    return true;
  }

  saveConfiguration() {
    if (!isEmpty(this.changedConfig) && this.pluginConfiguration?.name) {
      this.updateConfiguration(this.pluginConfiguration.name, this.changedConfig, 'plugin-config');
    }

    if (!isEmpty(this.advancedConfiguration)) {
      this.advancedConfiguration.forEach(element => {
        this.updateConfiguration(element.key, element.config, 'plugin-config');
      });
    }

    if (this.apiCallsStack.length > 0) {
      forkJoin(this.apiCallsStack).subscribe((result) => {
        result.forEach((r: any) => {
          this.reenableButton.emit(false);
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
        this.apiCallsStack = [];
        this.getCategory();
      });
    }
  }

  saveFilterConfiguration() {
    if (this.unsavedChangesInFilterForm) {
      this.filtersListComponent.update();
      this.unsavedChangesInFilterForm = false;
    }
  }

  checkFormState() {
    const noChange = isEmpty(this.changedConfig) && isEmpty(this.advancedConfiguration);
    return noChange;
  }
  
  checkFilterFormState() {
    const noChange = !this.unsavedChangesInFilterForm;
    return noChange;
  }

  getChangedConfig(changedConfiguration: any) {
    this.changedConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, this.pluginConfiguration);
  }

  getChangedAdvanceConfiguration(advanceConfig: any) {
    const configItem = this.advancedConfiguration.find(c => c.key == advanceConfig.key);
    if (configItem) {
      configItem.config = advanceConfig.config;
      if (isEmpty(configItem.config)) {
        this.advancedConfiguration = this.advancedConfiguration.filter(conf => (conf.key !== configItem.key));
      }
    } else {
      this.advancedConfiguration.push(advanceConfig)
    }
  }

  updateConfiguration(categoryName: string, configuration: any, type: string) {
    const files = this.getScriptFilesToUpload(configuration);
    if (files.length > 0) {
      this.uploadScript(categoryName, files);
    }

    if (isEmpty(configuration)) {
      return;
    }
    this.apiCallsStack.push(this.configService.
      updateBulkConfiguration(categoryName, configuration)
      .pipe(map(() => ({ type, success: true })))
      .pipe(catchError(e => of({ error: e, failed: true }))));
  }

  getScriptFilesToUpload(configuration: any) {
    return this.fileUploaderService.getConfigurationPropertyFiles(configuration);
  }

  public uploadScript(categoryName: string, files: any[]) {
    this.fileUploaderService.uploadConfigurationScript(categoryName, files);
  }

  filterFormStatus(status: boolean) {
    this.unsavedChangesInFilterForm = status;
  }
}
