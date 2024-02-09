import { Component, Input, HostBinding, ChangeDetectorRef, OnChanges, ElementRef } from "@angular/core";
import { ClassicPreset } from "rete";
import { KeyValue } from "@angular/common";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { ConfigurationService, PingService, RolesService, SchedulesService, ServicesApiService, ToastService } from "./../../../../services";
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
  service = { name: "", status: "", protocol: "", address: "", management_port: "", pluginName: "", assetCount: "", readingCount: "", schedule_enabled: 'false' }
  filter = { pluginName: '', enabled: 'false', name: '', color: '' }
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
    private toastService: ToastService,
    public rolesService: RolesService,
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
      if (this.source !== '') {
        this.elRef.nativeElement.style.borderColor = "#B6D7A8";
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
        this.service.schedule_enabled = Object.keys(this.data.controls)[5];
        if (this.service.status === '') {
          this.service.status = 'shutdown';
        }

        this.data.label = this.service.name;
        if (this.service.schedule_enabled === 'true') {
          this.isEnabled = true;
        }
        this.helpText = this.service.pluginName;
        this.pluginName = this.service.pluginName;
      }
      else {
        this.elRef.nativeElement.style.borderColor = "#EA9999";
        this.elRef.nativeElement.style.borderWidth = "6px";
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
      if (this.filter.name !== "Filter") {
        this.helpText = this.filter.pluginName;
        this.pluginName = this.filter.pluginName;
        if (this.filter.enabled === 'true') {
          this.isEnabled = true;
        }
      }
      else {
        this.addFilterSubscription = this.flowEditorService.showAddFilterIcon.subscribe((data) => {
          if (data) {
            if (data.addedFiltersIdColl.includes(this.nodeId)) {
              this.elRef.nativeElement.style.borderColor = "#EA9999";
              this.elRef.nativeElement.style.borderWidth = "6px";
              this.showPlusIcon = true;
            }
          }
        })
      }
    }
    if (this.data.label === 'Applications') {
      this.helpText = 'Filters';
    }
    if (this.data.label === 'AddService') {
      this.data.label = "";
    }
    if (this.data.label === 'Storage') {
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
    if (this.isServiceNode) {
      this.flowEditorService.showItemsInQuickview.next({ showPluginConfiguration: true, showFilterConfiguration: false, showLogs: false, serviceName: this.service.name });
    }
    else {
      this.flowEditorService.showItemsInQuickview.next({ showPluginConfiguration: false, showFilterConfiguration: true, showLogs: false, serviceName: this.source, filterName: this.filter.name });
    }
  }

  showLogsInQuickview() {
    this.flowEditorService.showItemsInQuickview.next({ showPluginConfiguration: false, showFilterConfiguration: false, showLogs: true, serviceName: this.service.name });
  }

  navToSyslogs() {
    this.router.navigate(['logs/syslog'], { queryParams: { source: this.service.name } });
  }

  addFilter() {
    this.flowEditorService.filterInfo.next({ name: "newPipelineFilter" });
  }

  navToSouthPage() {
    this.router.navigate(['/south']);
  }

  toggleEnabled(isEnabled) {
    this.isEnabled = isEnabled;
    if (this.isServiceNode) {
      if (this.isEnabled) {
        this.enableSchedule(this.service.name);
      }
      else {
        this.disableSchedule(this.service.name);
      }
    }
    if (this.isFilterNode) {
      this.updateFilterConfiguration();
    }
  }

  public disableSchedule(serviceName) {
    this.schedulesService.disableScheduleByName(serviceName)
      .subscribe((data: any) => {
        this.toastService.success(data.message);
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  public enableSchedule(serviceName) {
    this.schedulesService.enableScheduleByName(serviceName)
      .subscribe((data: any) => {
        this.toastService.success(data.message);
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  goToLink() {
    if (this.isServiceNode) {
      this.docService.goToPluginLink({ name: this.pluginName, type: 'South' });
    }
    else {
      this.docService.goToPluginLink({ name: this.pluginName, type: 'Filter' });
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
      this.flowEditorService.serviceInfo.next({ name: this.service.name })
    }
    if (this.isFilterNode) {
      this.flowEditorService.filterInfo.next({ name: this.filter.name })
    }
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
      .subscribe(() => {
        if (this.isEnabled) {
          this.toastService.success(`${this.filter.name} filter enabled`);
        }
        else {
          this.toastService.success(`${this.filter.name} filter disabled`);
        }
      },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  getSouthboundServices() {
    this.servicesApiService.getSouthServices(true)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        const services = data.services as Service[];
        this.fetchedService = services.find(service => (service.name == this.service.name));
        if (this.fetchedService) {
          this.service.status = this.fetchedService.status;
          let assetCount = this.fetchedService.assets.length;
          let readingCount = this.fetchedService.assets.reduce((total, asset) => {
            return total + asset.count;
          }, 0)
          this.service.assetCount = assetCount;
          this.service.readingCount = readingCount;
          this.service.schedule_enabled = String(this.fetchedService.schedule_enabled);
          if (this.service.schedule_enabled === 'true') {
            this.isEnabled = true;
          }
          else {
            this.isEnabled = false;
          }
        }
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  ngOnDestroy() {
    this.isAlive = false;
    this.subscription.unsubscribe();
    this.addFilterSubscription?.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
