import { Component, ElementRef, Injector, OnInit, ViewChild } from '@angular/core';
import { createEditor } from './editor';
import { ActivatedRoute } from '@angular/router';
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
  public category: any;
  private subscription: Subscription;

  showConfiguration: boolean = false;
  showLogs: boolean = false;
  service: Service;
  services: Service[];
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(public injector: Injector,
    private route: ActivatedRoute,
    private filterService: FilterService,
    private servicesApiService: ServicesApiService,
    private configService: ConfigurationService,
    public flowEditorService: FlowEditorService) {
    this.route.queryParams.subscribe(params => {
      if (params['source']) {
        this.source = params['source'];
        this.getSouthboundServices();
        if(this.source !== "nodelist"){
          this.getFilterPipeline();
          this.getCategory();
        }
      }
    });
  }

  ngOnInit(): void {
    this.subscription = this.flowEditorService.showItemsInQuickview.subscribe(data => {
      this.showConfiguration = data.showConfiguration;
      this.showLogs = data.showLogs;
    })
  }

  ngAfterViewInit(): void {
    const el = this.container.nativeElement;

    if (el) {
      setTimeout(() => {
        createEditor(el, this.injector, this.source, this.filterPipeline, this.service, this.services);
      }, 400);
    }
  }

  getFilterPipeline() {
    this.filterService.getFilterPipeline(this.source)
      .subscribe((data: any) => {
        this.filterPipeline = data.result.pipeline as string[];
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
    this.configService.getCategory(this.source).
      subscribe(
        (data) => {
          this.category = { name: this.source, config: data };
        },
        error => {
          console.log('service down ', error);
        }
      );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
