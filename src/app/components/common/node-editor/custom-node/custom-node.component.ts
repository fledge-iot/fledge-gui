import { Component, Input, HostBinding, ChangeDetectorRef, OnChanges, ElementRef } from "@angular/core";
import { ClassicPreset } from "rete";
import { KeyValue } from "@angular/common";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { ConfigurationService, PingService, SchedulesService, ServicesApiService } from "./../../../../services";
import { DocService } from "../../../../services/doc.service";
import { FlowEditorService } from "../flow-editor.service";
import { Subject, Subscription, interval } from "rxjs";
import { POLLING_INTERVAL } from "./../../../../utils";
import { takeUntil, takeWhile } from "rxjs/operators";
import { Service } from "./../../../core/south/south-service";

@Component({
  selector: 'app-custom-node',
  templateUrl: './custom-node.component.html',
  styleUrls: ['./custom-node.component.css'],
  host: {
    "data-testid": "node"
  }
})
export class CustomNodeComponent implements OnChanges {

  @Input() data!: ClassicPreset.Node;
  @Input() emit!: (data: any) => void;
  @Input() rendered!: () => void;

  seed = 0;
  source = '';
  helpText = '';
  isEnabled: boolean = false;
  service = { name: "", status: "", protocol: "", address: "", management_port: "", pluginName: "", assetCount: "", readingCount: "" }
  filter = { pluginName: '', enabled: 'false', name: '', color: ''}
  isServiceNode: boolean = false;
  subscription: Subscription;
  addFilterSubscription: Subscription;
  pluginName = '';
  isFilterNode: boolean = false;
  destroy$: Subject<boolean> = new Subject<boolean>();
  fetchedService;
  isAlive: boolean;
  showPlusIcon = false;
  nodeId = '';

  @HostBinding("class.selected") get selected() {
    return this.data.selected;
  }

  constructor(private cdr: ChangeDetectorRef,
    private schedulesService: SchedulesService,
    private docService: DocService,
    private router: Router,
    private route: ActivatedRoute,
    private servicesApiService: ServicesApiService,
    public flowEditorService: FlowEditorService,
    private configService: ConfigurationService,
    private elRef: ElementRef,
    private ping: PingService) {
    this.route.queryParams.subscribe(params => {
      if (params['source']) {
        this.source = params['source'];
      }
    });
    this.router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };
    this.router.navigated = false;
    this.subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.router.navigated = false;
      }
    });
    this.isAlive = true;
    this.ping.pingIntervalChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((timeInterval: number) => {
        if (timeInterval === -1) {
          this.isAlive = false;
        }
      });
  }

  ngOnChanges(): void {
    this.nodeId = this.data.id;
    if (this.data.label === 'South') {
      this.elRef.nativeElement.style.borderColor = "#B6D7A8";
      if (this.source !== '') {
        interval(POLLING_INTERVAL)
          .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
          .subscribe(() => {
            this.getSouthboundServices();
        });
        this.isServiceNode = true;
        
        this.service.name = Object.keys(this.data.controls)[0];
        this.service.pluginName = Object.keys(this.data.controls)[1].slice(6);
        this.service.assetCount = Object.keys(this.data.controls)[2].slice(3);
        this.service.readingCount = Object.keys(this.data.controls)[3].slice(3);
        this.service.status = Object.keys(this.data.controls)[4];
        if(this.service.status === ''){
          this.service.status = 'shutdown';
        }
        
        this.data.label = this.service.name;
        if (this.service.status === 'running') {
          this.isEnabled = true;
        }
        this.helpText = this.service.pluginName;
        this.pluginName = this.service.pluginName;
      }
    }
    if (this.data.label === 'Filter') {
      this.isFilterNode = true;
      this.filter.name = Object.keys(this.data.controls)[0];
      this.filter.pluginName = Object.keys(this.data.controls)[1].slice(6);
      this.filter.enabled = Object.keys(this.data.controls)[2];
      this.filter.color = Object.keys(this.data.controls)[3];
      this.elRef.nativeElement.style.borderColor = this.filter.color;
      this.data.label = this.filter.name;
      if(this.filter.name !== "Filter"){
        this.helpText = this.filter.pluginName;
        this.pluginName = this.filter.pluginName;
        if(this.filter.enabled === 'true'){
          this.isEnabled = true;
        }
      }
      else{
        this.addFilterSubscription = this.flowEditorService.showAddFilterIcon.subscribe((data)=>{
          if(data) {
            if(data.addedFiltersIdColl.includes(this.nodeId)){
              this.showPlusIcon = true;
            }
          }
        })
      }
    }
    if (this.data.label === 'Applications') {
      this.helpText = 'Filters';
    }
    if(this.data.label === 'AddService'){
      this.data.label = "";
    }
    if(this.data.label === 'Storage'){
      this.elRef.nativeElement.style.borderColor = "#999999";
    }
    this.cdr.detectChanges();
    requestAnimationFrame(() => this.rendered());
    this.seed++; // force render sockets
  }

  sortByIndex<
    N extends object,
    T extends KeyValue<string, N & { index?: number }>
  >(a: T, b: T) {
    const ai = a.value.index || 0;
    const bi = b.value.index || 0;

    return ai - bi;
  }

  addSouthService() {
    this.router.navigate(['/south/add'], { queryParams: { source: 'flowEditor' } });
  }

  navToSouthService() {
    this.router.navigate(['/south', this.service.name, 'details'], { queryParams: { source: 'flowEditor' } })
  }

  showConfigurationInQuickview() {
    if(this.isServiceNode){
      this.flowEditorService.showItemsInQuickview.next({showPluginConfiguration: true, showFilterConfiguration: false, showLogs: false, serviceName: this.service.name});
    }
    else{
      this.flowEditorService.showItemsInQuickview.next({showPluginConfiguration: false, showFilterConfiguration: true, showLogs: false, serviceName: this.source});
    }
  }

  showLogsInQuickview() {
    this.flowEditorService.showItemsInQuickview.next({showPluginConfiguration: false, showFilterConfiguration: false, showLogs: true, serviceName: this.service.name});
  }

  navToSyslogs() {
    this.router.navigate(['logs/syslog'], { queryParams: { source: this.service.name } });
  }

  addFilter() {
    this.flowEditorService.filterInfo.next({name: "newPipelineFilter"});
  }

  navToSouthPage() {
    this.router.navigate(['/south']);
  }

  toggleEnabled(isEnabled) {
    this.isEnabled = isEnabled;
    if(this.isServiceNode){
      if (this.isEnabled) {
        this.enableSchedule(this.service.name);
      }
      else {
        this.disableSchedule(this.service.name);
      }
    }
    if(this.isFilterNode){
      this.updateFilterConfiguration();
    }
  }

  public disableSchedule(serviceName) {
    this.schedulesService.disableScheduleByName(serviceName)
      .subscribe(
        () => {
          console.log("schedule disabled");
        },
        error => {
          console.log(error);
        });
  }

  public enableSchedule(serviceName) {
    this.schedulesService.enableScheduleByName(serviceName)
      .subscribe(
        () => {
          console.log("schedule enabled");
        },
        error => {
          console.log(error);
        });
  }

  goToLink() {
    if(this.isServiceNode){
      this.docService.goToPluginLink({name: this.pluginName, type: 'South'});
    }
    else{
      this.docService.goToPluginLink({name: this.pluginName, type: 'Filter'});
    }
  }

  applyServiceStatusCustomCss(serviceStatus: string) {
    if (serviceStatus.toLowerCase() === 'running') {
      return 'has-text-success';
    }
    if (serviceStatus.toLowerCase() === 'unresponsive') {
      return 'has-text-warning';
    }
    if (serviceStatus.toLowerCase() === 'shutdown') {
      return 'has-text-grey-lighter';
    }
    if (serviceStatus.toLowerCase() === 'failed') {
      return 'has-text-danger';
    }
  }

  deleteFilterOrService() {
    if (this.isServiceNode) {
      this.servicesApiService.deleteService(this.service.name)
        .subscribe(
          () => {
            this.router.navigate(['/south/flow'], { queryParams: { source: 'nodelist' } });
          },
          (error) => {
            console.log('service down ', error);
          });
    }
    if(this.isFilterNode){
      this.flowEditorService.filterInfo.next({name: this.filter.name})
    }
  }

  ngOnDestroy() {
    this.isAlive = false;
    this.subscription.unsubscribe();
    this.addFilterSubscription.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  openServiceDetails() {
    this.router.navigate(['/south/flow'], { queryParams: { source: this.service.name } });
  }
  
  navToAddServicePage() {
    this.router.navigate(['/south/flow']);
  }

  updateFilterConfiguration() {
    let catName = `${this.source}_${this.filter.name}`;
    this.configService.
      updateBulkConfiguration(catName, { enable: String(this.isEnabled) })
      .subscribe(
        () => {
          if(this.isEnabled){
            console.log(this.filter.name + " filter enabled");
          }
          else{
            console.log(this.filter.name + " filter disabled");
          }
        },
        (error) => {
          console.log('service down ', error);
        });
  }

  getSouthboundServices() {
    this.servicesApiService.getSouthServices(true)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any) => {
          const services = data.services as Service[];
          this.fetchedService = services.find(service => (service.name == this.service.name));
          if(this.fetchedService){
            this.service.status = this.fetchedService.status;
            let assetCount = this.fetchedService.assets.length;
            let readingCount = this.fetchedService.assets.reduce((total, asset) => {
                return total + asset.count;
            }, 0)
            this.service.assetCount = assetCount;
            this.service.readingCount = readingCount;
          }
        },
        error => {
          console.log('service down ', error);
        });
  }
}
