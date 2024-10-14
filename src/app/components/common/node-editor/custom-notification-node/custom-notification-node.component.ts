import { isEmpty } from 'lodash';
import { Component, Input, HostBinding, ChangeDetectorRef, OnChanges, ElementRef } from "@angular/core";
import { ClassicPreset } from "rete";
import { KeyValue } from "@angular/common";
import { NavigationEnd, Router } from "@angular/router";
import { RolesService, ConfigurationService } from "../../../../services";
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
  helpText = '';
  showPluginName = false;

  notification = {
    name: "",
    channel: "",
    enable: false,
    notificationType: "",
    retriggerTime: "",
    rule: "",
    isDeliveryEnabled: false,
    isServiceEnabled: false
  }

  isNotificationNode: boolean = false;

  subscription: Subscription;
  pluginName = '';
  destroy$: Subject<boolean> = new Subject<boolean>();

  showPlusIcon = false;
  showDeleteIcon = false;
  nodeId = '';
  timeoutId;

  @HostBinding("class.selected") get selected() {
    return this.data.selected;
  }

  constructor(private cdr: ChangeDetectorRef,
    private docService: DocService,
    private router: Router,
    public flowEditorService: FlowEditorService,
    public rolesService: RolesService,
    public configurationService: ConfigurationService,
    private elRef: ElementRef) {
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
    if (!isEmpty(this.data.controls)) {
      this.elRef.nativeElement.style.borderColor = "#0E9BD8";
      this.isNotificationNode = true;
      if (this.data.label === 'Notification') {
        this.notification.name = this.data.controls.nameControl['name'];
        this.notification.channel = this.data.controls.channelControl['pluginName'];
        this.notification.rule = this.data.controls.ruleControl['pluginName'];
        this.notification.notificationType = this.data.controls.notificationTypeControl['type'];
        this.notification.enable = this.data.controls.enabledControl['enabled'] === 'true' ? true : false;
        this.notification.isServiceEnabled = this.data.controls.serviceStatusControl['enabled'];
        // TODO (OPTIMIZE): API call for bolt (delivery/notify plugin enable state) icon highlighting
        this.isDeliveryEnabled();
      }
      this.notification.isServiceEnabled = this.data.controls.serviceStatusControl['enabled'];
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
    this.router.navigate(['flow/editor', 'notifications', 'add'], { queryParams: { source: 'flowEditor' } });
  }

  showConfigurationInQuickview() {
    this.flowEditorService.showItemsInQuickview.next({ showNotificationConfiguration: true, notification: this.notification });
  }

  showLogsInQuickview() {
    this.flowEditorService.showLogsInQuickview.next({ showLogs: true, notification: this.notification });
  }

  navToNotificationPage() {
    this.router.navigate(['/notification']);
  }

  public isDeliveryEnabled(): void {
    const notificationName = this.notification.name;
    this.configurationService.getCategory(`delivery${notificationName}`).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            this.notification.isDeliveryEnabled = data['enable'].value;
          }
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
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

  toggleState(event = null) {
    if (event) {
      event.preventDefault();
    }
    const btnText = this.notification.enable ? 'Disable' : 'Enable';
    this.flowEditorService.serviceInfo.next({ name: this.notification.name, buttonText: btnText });
  }

  navToAddNotificationPage() {
    this.router.navigate(['/flow/editor', 'notifications', 'add'], { queryParams: { source: 'flowEditor' } });
  }

  openDropdown() {
    this.timeoutId = setTimeout(() => {
      this.flowEditorService.nodeClick.next(this.data);
      const dropDown = document.querySelector('#nodeDropdown-' + this.nodeId);
      dropDown.classList.add('is-active');
    }, 250);
  }

  closeDropdown() {
    clearTimeout(this.timeoutId);
    const dropDown = document.querySelector('#nodeDropdown-' + this.nodeId);
    if (dropDown.classList.contains('is-active')) {
      dropDown.classList.remove('is-active');
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
