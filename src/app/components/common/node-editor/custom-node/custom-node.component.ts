import { Component, Input, HostBinding, ChangeDetectorRef, OnChanges } from "@angular/core";
import { ClassicPreset } from "rete";
import { KeyValue } from "@angular/common";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { SchedulesService, ServicesApiService } from "./../../../../services";
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
  isServiceNode: boolean = false;
  subscription: Subscription;

  @HostBinding("class.selected") get selected() {
    return this.data.selected;
  }

  constructor(private cdr: ChangeDetectorRef,
    private schedulesService: SchedulesService,
    private docService: DocService,
    private router: Router,
    private route: ActivatedRoute,
    private servicesApiService: ServicesApiService,
    public flowEditorService: FlowEditorService) {
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
        this.service.status = Object.keys(this.data.controls)[1];
        this.service.protocol = Object.keys(this.data.controls)[2];
        this.service.address = Object.keys(this.data.controls)[3];
        this.service.pluginName = Object.keys(this.data.controls)[4];
        this.service.management_port = Object.keys(this.data.controls)[5].slice(3);
        this.service.assetCount = Object.keys(this.data.controls)[6].slice(3);
        this.service.readingCount = Object.keys(this.data.controls)[7].slice(3);
        
        this.data.label = this.service.name;
        if (this.service.status === 'running') {
          this.isEnabled = true;
        }
        this.helpText = this.service.pluginName;
      }
    }
    if (this.data.label === 'Filter') {
      this.data.label = Object.keys(this.data.controls)[0];
      this.helpText = 'metadata';
    }
    if (this.data.label === 'Applications') {
      this.helpText = 'Filters';
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
    this.router.navigate(['/south', this.service.name, 'details'], { queryParams: { source: 'flowEditorFilter' } })
  }

  navToSouthPage() {
    this.router.navigate(['/south']);
  }

  toggleEnabled(isEnabled) {
    this.isEnabled = isEnabled;
    if (this.isEnabled) {
      this.enableSchedule(this.service.name);
    }
    else {
      this.disableSchedule(this.service.name);
    }
  }

  public disableSchedule(serviceName) {
    this.schedulesService.disableScheduleByName(serviceName)
      .subscribe(
        () => {
          console.log("schedule disabled");
          setTimeout(() => {
            this.router.navigate(['/south/node-editor'], { queryParams: { source: 'nodelist' } });
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
            this.router.navigate(['/south/node-editor'], { queryParams: { source: 'nodelist' } });
          }, 2000);
        },
        error => {
          console.log(error);
        });
  }

  goToLink(pluginInfo) {
    this.docService.goToPluginLink(pluginInfo);
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

  deleteService() {
    if (this.isServiceNode) {
      this.servicesApiService.deleteService(this.service.name)
        .subscribe(
          () => {
            this.router.navigate(['/south/node-editor'], { queryParams: { source: 'nodelist' } });
          },
          (error) => {
            console.log('service down ', error);
          });
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  openServiceDetails() {
    this.router.navigate(['/south/node-editor'], { queryParams: { source: this.service.name } });
  }
}
