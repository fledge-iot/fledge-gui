import { isEmpty } from 'lodash';
import { Component, Input, HostBinding, ChangeDetectorRef, OnChanges, ElementRef } from "@angular/core";
import { ClassicPreset } from "rete";
import { KeyValue } from "@angular/common";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import {
  ConfigurationService,
  NorthService, PingService,
  RolesService,
  SchedulesService,
  ServicesApiService,
  ToastService
} from "../../../../services";
import { DocService } from "../../../../services/doc.service";
import { FlowEditorService } from "../flow-editor.service";
import { Subject, Subscription } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { Service } from "../../../core/south/south-service";
import { NorthTask } from "../../../core/north/north-task";

@Component({
  selector: 'app-custom-notification-node',
  templateUrl: './custom-notification-node.component.html',
  styleUrls: ['./custom-notification-node.component.css'],
  host: {
    "data-testid": "node"
  }
})
export class CustomNodeComponent implements OnChanges {

  @Input() data!: ClassicPreset.Node;
  @Input() emit!: (data: any) => void;
  @Input() rendered!: () => void;

  nodeTypes = ['Notification', 'AddNotification'];

  seed = 0;
  source;
  from = '';
  helpText = '';
  isEnabled: boolean = false;
  
  notification = {
    name: "",
    channel: "",
    enable: false,
    notificationType: "",
    retriggerTime: "",
    rule: ""
  }

  isNotificationNode: boolean = false;

  subscription: Subscription;
  pluginName = '';
  destroy$: Subject<boolean> = new Subject<boolean>();
  
  showPlusIcon = false;
  showDeleteIcon = false;
  nodeId = '';

  @HostBinding("class.selected") get selected() {
    return this.data.selected;
  }

  constructor(private cdr: ChangeDetectorRef,   
    private docService: DocService,
    private router: Router,
    private route: ActivatedRoute,
    public flowEditorService: FlowEditorService,
    private configService: ConfigurationService,
    private toastService: ToastService,
    public rolesService: RolesService,
    private elRef: ElementRef,
    private ping: PingService) {
    this.route.params.subscribe(params => {
      this.from = params.from;
      this.source = params.name;
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
    console.log('data5', this.data);
    console.log('from', this.from);
    this.nodeId = this.data.id;
    if (this.data.label === 'Notification') {
      if (this.source !== '') {
        this.elRef.nativeElement.style.borderColor = "#0E9BD8";
        this.isNotificationNode = true;
        if (this.from == 'notification') {
          if (!isEmpty(this.data.controls)) {
            this.notification.name = this.data.controls.nameControl['name'];
            this.notification.channel = this.data.controls.channelControl['pluginName'];
            this.notification.rule = this.data.controls.ruleControl['pluginName'];
            this.notification.enable = this.data.controls.enabledControl['enable'];
            this.isEnabled = this.notification.enable;
          }
        }
      }
      else {
        this.elRef.nativeElement.style.borderColor = "#EA9999";
        this.elRef.nativeElement.style.borderWidth = "6px";
      }
    }

    const labels = ['AddNotification'];
    if (labels.includes(this.data.label)) {
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

  addService() {
    this.router.navigate(['flow/editor', this.from, 'add'], { queryParams: { source: 'flowEditor' } });
  }

  showConfigurationInQuickview() {
    if (this.isNotificationNode) {
      this.flowEditorService.showItemsInQuickview.next({ showPluginConfiguration: true, serviceName: this.notification.name });
    }
    // else {
    //   this.flowEditorService.showItemsInQuickview.next({ showFilterConfiguration: true, serviceName: this.source, filterName: this.filter.name });
    // }
  }

  showLogsInQuickview() {
    this.flowEditorService.showItemsInQuickview.next({ showLogs: true, serviceName: this.notification.name });
  }

  navToSyslogs() {
    this.router.navigate(['logs/syslog'], { queryParams: { source: this.notification.name } });
  }

  // addFilter() {
  //   this.flowEditorService.filterInfo.next({ name: "newPipelineFilter" });
  // }

  navToNotificationPage() {
    this.router.navigate(['/notification']);
  }

  // toggleEnabled(isEnabled) {
  //   this.isEnabled = isEnabled;
  //   if (this.isNotificationNode) {
  //     if (this.isEnabled) {
  //       this.enableSchedule(this.notification.name);
  //     }
  //     else {
  //       this.disableSchedule(this.notification.name);
  //     }
  //   }
  //   // if (this.isFilterNode) {
  //   //   this.updateFilterConfiguration();
  //   // }
  // }

  // public disableSchedule(serviceName) {
  //   this.schedulesService.disableScheduleByName(serviceName)
  //     .subscribe((data: any) => {
  //       this.toastService.success(data.message);
  //     },
  //       error => {
  //         if (error.status === 0) {
  //           console.log('service down ', error);
  //         } else {
  //           this.toastService.error(error.statusText);
  //         }
  //       });
  // }

  // public enableSchedule(serviceName) {
  //   this.schedulesService.enableScheduleByName(serviceName)
  //     .subscribe((data: any) => {
  //       this.toastService.success(data.message);
  //     },
  //       error => {
  //         if (error.status === 0) {
  //           console.log('service down ', error);
  //         } else {
  //           this.toastService.error(error.statusText);
  //         }
  //       });
  // }

  goToLink() {
    if (this.isNotificationNode) {
      this.docService.goToPluginLink({ name: this.pluginName, type: this.from });
    }
    // else {
    //   this.docService.goToPluginLink({ name: this.pluginName, type: 'Filter' });
    // }
  }

  applyNotificationStatusCustomCss(notificationStatus: string) {
    if (notificationStatus?.toLowerCase() === 'true') {
      return 'has-text-success';
    }
    if (notificationStatus?.toLowerCase() === 'false') {
      return 'has-text-grey-lighter';
    }
  }

  deleteFilterOrService() {
    if (this.isNotificationNode) {
      this.flowEditorService.serviceInfo.next({ name: this.notification.name })
    }
    // if (this.isFilterNode) {
    //   this.flowEditorService.filterInfo.next({ name: this.filter.name })
    // }
  }

  // openTaskSchedule() {
  //   this.flowEditorService.showItemsInQuickview.next({ showTaskSchedule: true, serviceName: this.service.name });
  // }

  openNotificationDetails() {
    this.router.navigate(['/flow/editor', this.from, this.notification.name, 'details']);
  }

  navToAddServicePage() {
    this.router.navigate(['/flow/editor', this.from, 'add'], { queryParams: { source: 'flowEditor' } });
  }

  // updateFilterConfiguration() {
  //   let catName = `${this.source}_${this.filter.name}`;
  //   this.configService.
  //     updateBulkConfiguration(catName, { enable: String(this.isEnabled) })
  //     .subscribe(() => {
  //       this.data.controls.enabledControl['enabled'] = JSON.stringify(this.isEnabled);
  //       if (this.isEnabled) {
  //         this.toastService.success(`${this.filter.name} filter enabled`);
  //       }
  //       else {
  //         this.toastService.success(`${this.filter.name} filter disabled`);
  //       }
  //     },
  //       (error) => {
  //         if (error.status === 0) {
  //           console.log('service down ', error);
  //         } else {
  //           this.toastService.error(error.statusText);
  //         }
  //       });
  // }

  // getNorthboundTasks() {
  //   this.northService.getNorthTasks(true)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe((data: any) => {
  //       const tasks = data as NorthTask[];
  //       this.fetchedTask = tasks.find(task => (task.name == this.service.name));
  //       if (this.fetchedTask) {
  //         this.service.status = this.fetchedTask?.status;
  //         let readingCount = this.fetchedTask.sent;
  //         this.service.readingCount = readingCount;
  //         this.service.schedule_enabled = this.fetchedTask.enabled;
  //         if (this.service.schedule_enabled === true) {
  //           this.isEnabled = true;
  //         }
  //         else {
  //           this.isEnabled = false;
  //         }
  //       }
  //     },
  //       error => {
  //         if (error.status === 0) {
  //           console.log('service down ', error);
  //         } else {
  //           this.toastService.error(error.statusText);
  //         }
  //       });
  // }

  // getSouthboundServices() {
  //   this.servicesApiService.getSouthServices(true)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe((data: any) => {
  //       const services = data.services as Service[];
  //       this.fetchedService = services.find(service => (service.name == this.service.name));
  //       if (this.fetchedService) {
  //         this.service.status = this.fetchedService.status;
  //         let assetCount = this.fetchedService.assets.length;
  //         let readingCount = this.fetchedService.assets.reduce((total, asset) => {
  //           return total + asset.count;
  //         }, 0)
  //         this.service.assetCount = assetCount;
  //         this.service.readingCount = readingCount;
  //         this.service.schedule_enabled = this.fetchedService.schedule_enabled;
  //         if (this.service.schedule_enabled === true) {
  //           this.isEnabled = true;
  //         }
  //         else {
  //           this.isEnabled = false;
  //         }
  //       }
  //     },
  //       error => {
  //         if (error.status === 0) {
  //           console.log('service down ', error);
  //         } else {
  //           this.toastService.error(error.statusText);
  //         }
  //       });
  // }

  // removeFilter() {
  //   this.flowEditorService.removeFilter.next({ id: this.nodeId });
  // }

  // showReadingsPerAsset() {
  //   this.flowEditorService.showItemsInQuickview.next({ showReadings: true, serviceName: this.service.name });
  // }

  // getAssetReadings() {
  //   this.flowEditorService.exportReading.next({serviceName: this.service.name});
  // }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
