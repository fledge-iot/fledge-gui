import { isEmpty } from 'lodash';
import { Component, Input, HostBinding, ChangeDetectorRef, OnChanges, ElementRef } from "@angular/core";
import { ClassicPreset } from "rete";
import { KeyValue } from "@angular/common";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { RolesService, ConfigurationService, AlertService } from "../../../../services";
import { DocService } from "../../../../services/doc.service";
import { FlowEditorService } from "../flow-editor.service";
import { Subject, Subscription } from "rxjs";

@Component({
  selector: 'app-custom-notification-node',
  templateUrl: './custom-notification-node.component.html',
  styleUrls: ['./custom-notification-node.component.css'],
  host: {
    "data-testid": "notification-node"
  }
})
export class CustomNotificationNodeComponent implements OnChanges {

  @Input() data!: ClassicPreset.Node;
  @Input() emit!: (data: any) => void;
  @Input() rendered!: () => void;

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
    public rolesService: RolesService,
    public configurationService: ConfigurationService,
    private alertService: AlertService,
    private elRef: ElementRef) {
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
    this.nodeId = this.data.id;
    if (this.data.label === 'Notification') {
      if (this.source !== '') {
        this.elRef.nativeElement.style.borderColor = "#0E9BD8";
        this.isNotificationNode = true;
        if (this.from == 'notifications') {
          if (!isEmpty(this.data.controls)) {
            this.notification.name = this.data.controls.nameControl['name'];
            this.notification.channel = this.data.controls.channelControl['pluginName'];
            this.notification.rule = this.data.controls.ruleControl['pluginName'];
            this.notification.notificationType = this.data.controls.notificationTypeControl['type'];
            this.notification.enable = this.data.controls.enabledControl['enabled'] === 'true' ? true : false;
            this.isEnabled = this.notification.enable;
          }
        }
      }
      else {
        this.elRef.nativeElement.style.borderColor = "#EA9999";
        this.elRef.nativeElement.style.borderWidth = "6px";
      }
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
    this.flowEditorService.showItemsInQuickview.next({ showNotificationConfiguration: true, notification: this.notification });
  }

  showLogsInQuickview() {
    this.flowEditorService.showItemsInQuickview.next({ showLogs: true, notification: this.notification });
  }

  navToNotificationPage() {
    this.router.navigate(['/notification']);
  }

  toggleEnabled(isEnabled) {
    this.isEnabled = isEnabled;
    const payload = {
      enable: this.isEnabled ? 'true' : 'false'
    }
    this.configurationService.updateBulkConfiguration(this.notification.name, payload)
      .subscribe(() => {
        this.alertService.success(`Instance successfully ${this.isEnabled ? 'enabled' : 'disabled'}.`, true);
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  goToLink() {
    const urlSlug = 'notifications';
    this.docService.goToServiceDocLink(urlSlug, 'fledge-service-notification');
  }

  deleteNotification() {
    this.flowEditorService.serviceInfo.next({ name: this.notification.name });
  }

  navToAddNotificationPage() {
    this.router.navigate(['/flow/editor', this.from, 'add'], { queryParams: { source: 'flowEditor' } });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
