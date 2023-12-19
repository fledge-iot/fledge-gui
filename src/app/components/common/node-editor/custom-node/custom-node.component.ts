import { Component, Input, HostBinding, ChangeDetectorRef, OnChanges } from "@angular/core";
import { ClassicPreset } from "rete";
import { KeyValue } from "@angular/common";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { ConfigurationService, SchedulesService, ServicesApiService } from "./../../../../services";
import { DocService } from "../../../../services/doc.service";
import { FlowEditorService } from "../flow-editor.service";
import { Subscription } from "rxjs";

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
  filter = { pluginName: '', enabled: 'false', name: ''}
  isServiceNode: boolean = false;
  subscription: Subscription;
  pluginName = '';
  isFilterNode: boolean = false;

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
    private configService: ConfigurationService,) {
    this.cdr.detach();
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
  }

  ngOnChanges(): void {
    if (this.data.label === 'South') {
      if (this.source !== '') {
        this.isServiceNode = true;
        
        this.service.name = Object.keys(this.data.controls)[0];
        this.service.pluginName = Object.keys(this.data.controls)[1];
        this.service.assetCount = Object.keys(this.data.controls)[2].slice(3);
        this.service.readingCount = Object.keys(this.data.controls)[3].slice(3);
        this.service.status = Object.keys(this.data.controls)[4];
        if(this.service.status === ''){
          this.service.status = 'shutdown';
        }
        if(this.service.status !== 'shutdown'){
          this.service.protocol = Object.keys(this.data.controls)[5];
          this.service.address = Object.keys(this.data.controls)[6];
          this.service.management_port = Object.keys(this.data.controls)[7].slice(3);
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
      this.filter.pluginName = Object.keys(this.data.controls)[1];
      this.filter.enabled = Object.keys(this.data.controls)[2];
      this.data.label = this.filter.name;
      if(this.filter.name !== "Filter"){
        this.helpText = this.filter.pluginName;
        this.pluginName = this.filter.pluginName;
        if(this.filter.enabled === 'true'){
          this.isEnabled = true;
        }
      }
    }
    if (this.data.label === 'Applications') {
      this.helpText = 'Filters';
    }
    if(this.data.label === 'AddService'){
      this.data.label = "";
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
    this.flowEditorService.showItemsInQuickview.next({showConfiguration: true, showLogs: false, serviceName: this.service.name});
  }

  showLogsInQuickview() {
    this.flowEditorService.showItemsInQuickview.next({showConfiguration: false, showLogs: true, serviceName: this.service.name});
  }

  navToSyslogs() {
    this.router.navigate(['logs/syslog'], { queryParams: { source: this.service.name } });
  }

  addFilter() {
    this.router.navigate(['/south', this.source, 'details'], { queryParams: { source: 'flowEditorFilter' } })
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
          setTimeout(() => {
            this.router.navigate(['/south/flow'], { queryParams: { source: 'nodelist' } });
          }, 2000);
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
          setTimeout(() => {
            this.router.navigate(['/south/flow'], { queryParams: { source: 'nodelist' } });
          }, 2000);
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
    this.subscription.unsubscribe();
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
}
