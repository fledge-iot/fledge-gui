import { Component, ElementRef, HostListener, Injector, OnInit, ViewChild } from '@angular/core';
import { createEditor, getUpdatedFilterPipeline, deleteConnection } from './editor';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigurationService, FilterService, ServicesApiService } from './../../../services';
import { takeUntil } from 'rxjs/operators';
import { Service } from '../../core/south/south-service';
import { Subject, Subscription } from 'rxjs';
import { FlowEditorService } from './flow-editor.service';

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

  constructor(public injector: Injector,
    private route: ActivatedRoute,
    private filterService: FilterService,
    private servicesApiService: ServicesApiService,
    private configService: ConfigurationService,
    public flowEditorService: FlowEditorService,
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
    this.subscription = this.flowEditorService.showItemsInQuickview.subscribe(data => {
      this.showPluginConfiguration = data.showPluginConfiguration;
      this.showFilterConfiguration = data.showFilterConfiguration;
      this.showLogs = data.showLogs;
      this.serviceName = data.serviceName;
      if(this.showPluginConfiguration){
        this.getCategory();
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
          this.category = { name: this.serviceName, config: data };
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
}
