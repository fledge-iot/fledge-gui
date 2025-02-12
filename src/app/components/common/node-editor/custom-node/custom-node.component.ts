import { isEmpty } from 'lodash';
import { Component, Input, HostBinding, ChangeDetectorRef, OnChanges, ElementRef } from "@angular/core";
import { ClassicPreset } from "rete";
import { KeyValue } from "@angular/common";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import {
  RolesService
} from "./../../../../services";
import { DocService } from "../../../../services/doc.service";
import { FlowEditorService } from "../flow-editor.service";
import { Subject, Subscription } from "rxjs";

import { canUndo, canRedo } from './../editor';
import { DialogService } from '../../confirmation-dialog/dialog.service';

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

  nodeTypes = ['South', 'North', 'Filter', 'AddService', 'AddTask', 'Storage'];

  seed = 0;
  source;
  from = '';
  helpText = '';
  isEnabled: boolean = false;
  service = {
    name: "", status: "",
    protocol: "",
    address: "",
    management_port: "",
    pluginName: "",
    assetCount: "",
    readingCount: "",
    schedule_enabled: false,
    pluginVersion: ""
  }
  task = {
    name: "",
    day: "",
    enabled: false,
    exclusive: "",
    execution: "",
    id: "",
    plugin: "",
    processName: "",
    repeat: "",
    sent: "",
    taskStatus: {},
    pluginVersion: "",
    status: ""
  }
  filter = { pluginName: '', enabled: 'false', name: '', color: '', pluginVersion: "" }
  isServiceNode: boolean = false;
  subscription: Subscription;
  pluginName = '';
  isFilterNode: boolean = false;
  destroy$: Subject<boolean> = new Subject<boolean>();
  fetchedTask;
  fetchedService;
  nodeId = '';
  pluginVersion = '';
  timeoutId;

  previousState: boolean;  // To store previous state of checkbox
  serviceStatusSubscription: Subscription;

  @HostBinding("class.selected") get selected() {
    return this.data.selected;
  }

  constructor(private cdr: ChangeDetectorRef,
    private docService: DocService,
    private router: Router,
    private route: ActivatedRoute,
    public flowEditorService: FlowEditorService,
    public rolesService: RolesService,
    private dialogService: DialogService,
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

  openModal(id: string) {
    this.dialogService.open(id);
  }

  ngOnChanges(): void {
    this.nodeId = this.data.id;
    if (this.data.label === 'South' || this.data.label === 'North') {
      this.setSetectedNodeColor('#C781BB');
      if (this.source !== '') {
        this.isServiceNode = true;
        this.elRef.nativeElement.style.borderColor = this.data.label === 'South' ? "#B6D7A8" : '#C781BB'
        this.isServiceNode = true;
        if (this.from == 'north') {
          if (!isEmpty(this.data.controls)) {
            this.task.name = this.service.name = this.data.controls.nameControl['name'];
            this.task.plugin = this.service.pluginName = this.data.controls.pluginControl['plugin'];
            this.task.sent = this.service.readingCount = this.data.controls.sentReadingControl['sent'];
            this.task.execution = this.data.controls.executionControl['execution'];
            this.task.enabled = this.data.controls.enabledControl['enabled'];
            this.task.status = this.data.controls.statusControl['status'];
            this.task.pluginVersion = this.service.pluginVersion = this.data.controls.pluginVersionControl['pluginVersion'];
            this.isEnabled = this.task.enabled;
            this.helpText = this.task.plugin;
            this.pluginName = this.task.plugin;
            this.pluginVersion = this.task.pluginVersion;
          }
        } else {
          if (!isEmpty(this.data.controls)) {
            this.service.name = this.data.controls.nameControl['name']
            this.service.pluginName = this.data.controls.pluginControl['plugin'];
            this.service.assetCount = this.data.controls.assetCountControl['count'];
            this.service.readingCount = this.data.controls.readingCountControl['count'];
            this.service.status = this.data.controls.statusControl['status'];
            this.service.schedule_enabled = this.data.controls.enabledControl['enabled'];
            this.service.pluginVersion = this.data.controls.pluginVersionControl['pluginVersion'];
            this.isEnabled = this.service.schedule_enabled;
            this.helpText = this.service.pluginName;
            this.pluginName = this.service.pluginName;
            this.pluginVersion = this.service.pluginVersion;
          }
        }
      }
      else {
        this.elRef.nativeElement.style.borderColor = "#EA9999";
        this.elRef.nativeElement.style.borderWidth = "6px";
      }
    }
    if (this.data.label === 'Filter') {
      this.isFilterNode = true;
      this.filter.name = this.data.controls.nameControl['name'];
      this.filter.pluginName = this.data.controls.pluginControl['plugin'];
      this.filter.enabled = this.data.controls.enabledControl['enabled'];
      this.filter.color = this.data.controls.filterColorControl['color'];
      this.elRef.nativeElement.style.borderColor = this.filter.color;
      this.data.label = this.filter.name;
      if (this.filter.name !== "Filter") {
        this.helpText = this.filter.pluginName;
        this.pluginName = this.filter.pluginName;
        if (this.filter.enabled === 'true') {
          this.isEnabled = true;
        }
      }
      else if (!this.data['pseudoNode']) {
        this.elRef.nativeElement.style.outline = "#EA9999 dashed 2px";
        this.elRef.nativeElement.style.borderWidth = "0px";
        this.elRef.nativeElement.style.height = "auto";
      }
    }

    if (!this.nodeTypes.includes(this.data?.label) && !isEmpty(this.data.controls)) {
      this.setSetectedNodeColor('#F9CB9C');
      if (this.filter.name == this.data.label) {
        this.filter.enabled = this.data?.controls?.enabledControl['enabled'];
        if (this.filter.enabled === 'true') {
          this.isEnabled = true;
        } else if (this.filter.enabled === 'false') {
          this.isEnabled = false;
        }
      }
    }
    if (this.source && !this.data.selected) {
      this.flowEditorService.nodeClick.next(this.data);
    }

    const labels = ['AddService', 'AddTask'];
    if (labels.includes(this.data.label)) {
      this.data.label = "";
    }

    if (this.data.label === 'Storage') {
      this.elRef.nativeElement.style.borderColor = "#999999";
    }
    this.cdr.detectChanges();
    requestAnimationFrame(() => this.rendered());
    this.seed++; // force render sockets
    this.flowEditorService.checkHistory.next({ showUndo: canUndo(), showRedo: canRedo(false) });
  }

  setSetectedNodeColor(colorCode) {
    if (this.elRef.nativeElement.children.length !== 0 && this.elRef.nativeElement.children[0].classList.contains('selected-node')) {
      let boxShadowValue = this.data.label === "South" ? "0 1px 1px rgba(0, 0, 0, 0.075) inset, 0 0 8px #B6D7A8" : "0 1px 1px rgba(0, 0, 0, 0.075) inset, 0 0 8px" + colorCode;
      this.elRef.nativeElement.style.boxShadow = boxShadowValue;
    } else {
      this.elRef.nativeElement.style.removeProperty('box-shadow');
    }
  }

  sortByIndex<
    N extends object,
    T extends KeyValue<string, N & { index?: number }>
  >(a: T, b: T) {
    const ai = a.value.index || 0;
    const bi = b.value.index || 0;

    return ai - bi;
  }

  onNodeClick() {
    if (this.source) {
      this.data['isFilterNode'] = this.isFilterNode;
      this.flowEditorService.nodeClick.next(this.data);
    }
  }

  addService() {
    this.router.navigate(['flow/editor', this.from, 'add'], { queryParams: { source: 'flowEditor' } });
  }

  showConfigurationInQuickview() {
    if (this.isServiceNode) {
      this.flowEditorService.showItemsInQuickview.next({ showPluginConfiguration: true, serviceName: this.service.name });
    }
    else {
      this.flowEditorService.showItemsInQuickview.next({ showFilterConfiguration: true, serviceName: this.source, filterName: this.filter.name });
    }
  }

  showLogsInQuickview() {
    this.flowEditorService.showLogsInQuickview.next({ showLogs: true, serviceName: this.service.name });
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

  goToLink() {
    if (this.isServiceNode) {
      this.docService.goToPluginLink({ name: this.pluginName, type: this.from });
    }
    else {
      this.docService.goToPluginLink({ name: this.pluginName, type: 'Filter' });
    }
  }

  applyServiceStatusCustomCss(serviceStatus: string) {
    if (serviceStatus?.toLowerCase() === 'running') {
      return 'has-text-success';
    }
    if (serviceStatus?.toLowerCase() === 'unresponsive') {
      return 'has-text-warning';
    }
    if (serviceStatus?.toLowerCase() === 'shutdown') {
      return 'has-text-grey-lighter';
    }
    if (serviceStatus?.toLowerCase() === 'failed') {
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

  onCheckboxClicked(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const newCheckedState = checkbox.checked;
    // Store the previous state
    this.previousState = this.isEnabled;
    this.openStatusConfirmationDialog(newCheckedState);
    checkbox.checked = this.previousState;
  }

  openStatusConfirmationDialog(status: boolean) {
    let nodeName = null;
    let type = null;
    let oldState = false;
    let category = '';
    if (this.isServiceNode) {
      nodeName = this.service?.name;
    } else if (this.isFilterNode) {
      nodeName = this.filter?.name;
      category = `${this.source}_${this.filter.name}`;
      type = 'filter';
      oldState = (this.filter.enabled == 'true');
    }
    if (nodeName) {
      this.flowEditorService.updateNodeStatusSubject.next({ name: nodeName, newState: status, type, oldState, category });
      this.openModal('service-status-dialog');
    }
  }

  openTaskSchedule() {
    this.flowEditorService.showItemsInQuickview.next({ showTaskSchedule: true, serviceName: this.service.name });
  }

  openServiceDetails() {
    this.router.navigate(['/flow/editor', this.from, this.service.name, 'details']);
  }

  navToAddServicePage() {
    this.router.navigate(['/flow/editor', this.from, 'add'], { queryParams: { source: 'flowEditor' } });
  }

  removeFilter() {
    this.flowEditorService.removeFilter.next({ id: this.nodeId });
  }

  showReadingsPerAsset() {
    this.flowEditorService.showItemsInQuickview.next({ showReadings: true, serviceName: this.service.name });
  }

  getAssetReadings() {
    this.flowEditorService.exportReading.next({ serviceName: this.service.name });
  }

  openDropdown() {
    this.timeoutId = setTimeout(() => {
      this.flowEditorService.nodeDropdownClick.next({ nodeId: this.nodeId });
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
