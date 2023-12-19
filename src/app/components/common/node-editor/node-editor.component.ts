import { Component, ElementRef, Injector, OnInit, ViewChild } from '@angular/core';
import { createEditor } from './editor';
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
  public filterPipeline: string[] = [];
  public filterConfigurations: any[] = [];
  public category: any;
  private subscription: Subscription;
  private filterSubscription: Subscription;

  showConfiguration: boolean = false;
  showLogs: boolean = false;
  service: Service;
  services: Service[];
  destroy$: Subject<boolean> = new Subject<boolean>();
  serviceName = '';
  filterName = '';

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

  ngOnInit(): void {
    this.subscription = this.flowEditorService.showItemsInQuickview.subscribe(data => {
      this.showConfiguration = data.showConfiguration;
      this.showLogs = data.showLogs;
      this.serviceName = data.serviceName;
      if(this.showConfiguration){
        this.getCategory();
      }
    })
    this.filterSubscription = this.flowEditorService.filterInfo.subscribe(data => {
      this.filterName = data.name;
      if(this.filterPipeline.indexOf(this.filterName)!== -1){
        this.filterPipeline = this.filterPipeline.filter(f => f !== this.filterName);
        this.deleteFilter();
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
        this.createFilterConfigurationsArray();
      },
        error => {
          if (error.status === 404) {
            this.filterPipeline = [];
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
  }

  getFilterConfiguration(filterName: string) {
    let catName = `${this.source}_${filterName}`
    this.filterService.getFilterConfiguration(catName)
      .subscribe((data: any) => {
        if (data) {
          let filterConfig = {pluginName: data.plugin.value, enabled: data.enable.value, filterName: filterName};
          this.filterConfigurations.push(filterConfig);
        }
      },
        error => {
          console.log('service down ', error);
        });
  }

  createFilterConfigurationsArray(){
    this.filterPipeline.forEach((filterName)=>{
      this,this.getFilterConfiguration(filterName)
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
}
