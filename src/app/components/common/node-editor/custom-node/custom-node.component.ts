import { isEmpty } from 'lodash';
import { Component, Input, HostBinding, ChangeDetectorRef, OnChanges, ElementRef, OnDestroy } from "@angular/core";
import { KeyValue } from "@angular/common";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import {
  AlertService,
  ProgressBarService,
  RolesService,
  ServicesApiService,
  SharedService
} from "./../../../../services";
import { DocService } from "../../../../services/doc.service";
import { FlowEditorService } from "../flow-editor.service";
import { interval, of, Subject, Subscription } from "rxjs";

import { canUndo, canRedo, editor } from './../editor';
import { DialogService } from '../../confirmation-dialog/dialog.service';
import { catchError, distinctUntilChanged, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { Filter, North, Notification, South, Storage, DebugDataDisplay } from '../nodes';

@Component({
  selector: 'app-custom-node',
  templateUrl: './custom-node.component.html',
  styleUrls: ['./custom-node.component.css'],
  host: {
    "data-testid": "node"
  }
})
export class CustomNodeComponent implements OnChanges, OnDestroy {

  @Input() data!: South | Filter | North | Notification | Storage;
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

  previousState: boolean;  // To store previous state of checkbox
  isDataDisplayVisible: boolean = false;  // Track data display visibility state

  @HostBinding("class.selected") get selected() {
    return this.data.selected;
  }

  constructor(private cdr: ChangeDetectorRef,
    private docService: DocService,
    private router: Router,
    private route: ActivatedRoute,
    public flowEditorService: FlowEditorService,
    public rolesService: RolesService,
    private sharedService: SharedService,
    private dialogService: DialogService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService,
    private serviceApi: ServicesApiService,
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

    this.sharedService.debuggerStateSubject
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, curr) => {
          // Skip if data is not yet initialized
          if (!this.data) return true;
          
          // Skip debug data display nodes
          if (this.data.type === 'debug-data-display') return true;
          
          // For storage nodes, handle even when services array is empty or undefined
          if (this.data.label === 'Storage' && this.from === 'south') {
            if (!curr?.services || curr.services.length === 0) {
              // No services, ensure debug state is detached
              if (this.data.debug && this.data.debug.debugger !== 'Detached') {
                this.data.debug.debugger = 'Detached';
                this.data.debug.egress = 'Storage';
                return false; // Trigger update
              }
              return true;
            }

            const serviceWithDebugger = curr.services.find((s: any) => s.debug?.debugger === 'Attached');
            if (!serviceWithDebugger) {
              // No service with attached debugger, reset storage debug state
              if (this.data.debug && this.data.debug.debugger !== 'Detached') {
                this.data.debug.debugger = 'Detached';
                this.data.debug.egress = 'Storage';
                return false; // Trigger update
              }
              return this.data.debug?.debugger === 'Detached';
            }
            // Compare storage node debug state with service debug state
            return this.data.debug?.debugger === serviceWithDebugger.debug?.debugger &&
              this.data.debug?.egress === serviceWithDebugger.debug?.egress;
          }

          // Skip if no debug data in service response for other nodes
          if (!curr?.services) return true;

          // Get current node's service name
          const nodeName = this.data?.controls?.nameControl?.['name'];
          if (!nodeName) return true;

          // Find the service in the response that matches this node
          const serviceData = curr.services.find(s => s.name === nodeName);
          if (!serviceData) return true;

          // Compare current node debug state with new state from matching service
          return this.data.debug?.debugger === serviceData.debug?.debugger &&
            this.data.debug?.ingress === serviceData.debug?.ingress &&
            this.data.debug?.egress === serviceData.debug?.egress;
        })
      )
      .subscribe((servicesResponse: any) => {
        // Skip if data is not yet initialized
        if (!this.data) return;
        
        // Skip debug data display nodes
        if (this.data.type === 'debug-data-display') return;
        
        // Handle storage nodes
        if (this.data.label === 'Storage' && this.from === 'south') {
          const serviceWithDebugger = servicesResponse.services?.find((s: any) => s.debug?.debugger === 'Attached');
          if (serviceWithDebugger?.debug) {
            // Initialize debug object if it doesn't exist
            if (!this.data.debug) {
              this.data.debug = {
                debugger: 'Attached',
                ingress: 'Running',
                egress: 'Storage'
              };
            }
            this.data.debug.debugger = serviceWithDebugger.debug.debugger;
            this.data.debug.egress = serviceWithDebugger.debug.egress || 'Storage';
            this.cdr.detectChanges();
          } else {
            // No service with attached debugger, reset storage debug state
            // Initialize debug object if it doesn't exist, or update it
            if (!this.data.debug) {
              this.data.debug = {
                debugger: 'Detached',
                ingress: 'Running',
                egress: 'Storage'
              };
            } else {
              this.data.debug.debugger = 'Detached';
              this.data.debug.egress = 'Storage';
            }
            this.cdr.detectChanges();
          }
          return;
        }

        // Handle service nodes
        if (!this.data?.controls?.nameControl?.['name'] || !this.data?.debug) return;

        // Find the matching service in the response
        const nodeName = this.data.controls.nameControl['name'];
        const serviceData = servicesResponse.services?.find(s => s.name === nodeName);

        // Only update debug state if we found matching service with debug info
        if (serviceData?.debug) {
          this.data.debug.debugger = serviceData.debug.debugger;
          this.data.debug.ingress = serviceData.debug.ingress;
          this.data.debug.egress = serviceData.debug.egress;
          this.cdr.detectChanges();
        }
      });
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  ngOnChanges(): void {
    this.nodeId = this.data.id;
    
    // Skip processing for debug data display nodes
    if (this.data.type === 'debug-data-display') {
      this.cdr.detectChanges();
      requestAnimationFrame(() => this.rendered());
      return;
    }
    
    if (this.data.label === 'South' || this.data.label === 'North') {
      this.setSetectedNodeColor('#C781BB');
      if (this.source !== '') {
        // Only emit debug state if it has changed
        if (this.data.debug) {
          const currentDebugState = {
            service: this.source,
            debug: {
              debugger: this.data.debug.debugger,
              ingress: this.data.debug.ingress,
              egress: this.data.debug.egress
            }
          };
          this.sharedService.debuggerStateSubject.next(currentDebugState);
        }
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
      if (this.from == 'south' && this.data?.controls?.debugControl) {
        this.data.debug = this.data?.controls?.debugControl['debug'];
      }
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

  toggleDebuggerState() {
    this.ngProgress.start();
    const name = this.data.controls.nameControl['name'];
    const previousDebugState = this.data.debug.debugger;
    const expectedState = previousDebugState === 'Attached' ? 'Detached' : 'Attached';
    const action = previousDebugState === 'Attached' ? 'detach' : 'attach';
    this.serviceApi.manageServiceDebuggerState(name, action)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        // Immediately update the debugger state to reflect the change
        if (this.data.debug) {
          this.data.debug.debugger = expectedState;
          
          // Find and update all storage nodes
          const nodes = editor.getNodes();
          nodes.forEach((node: any) => {
            if (node.label === 'Storage' && this.from === 'south') {
              if (expectedState === 'Attached') {
                // When attaching, initialize or update storage node debug state
                if (!node.debug) {
                  node.debug = {
                    debugger: 'Attached',
                    ingress: 'Running',
                    egress: 'Storage'
                  };
                } else {
                  node.debug.debugger = 'Attached';
                  node.debug.egress = node.debug.egress || 'Storage';
                }
                // Also update the debug control if it exists
                if (node.controls?.debugControl) {
                  node.controls.debugControl['debug'] = { ...node.debug };
                }
              } else {
                // When detaching, reset ingress and egress state to remove suspend/resume/isolate/store options
                if (node.debug) {
                  node.debug.debugger = 'Detached';
                  node.debug.egress = 'Storage';
                  // Also update the debug control if it exists
                  if (node.controls?.debugControl) {
                    node.controls.debugControl['debug'] = { ...node.debug };
                  }
                }
              }
            }
          });
          
          // When detaching, reset ingress and egress state to remove suspend/resume options
          if (expectedState === 'Detached') {
            if (this.data.debug.ingress) {
              this.data.debug.ingress = 'Running';
            }
            if (this.data.debug.egress) {
              this.data.debug.egress = 'Storage';
            }
            
            // Emit to sharedService to trigger updates in all components
            this.sharedService.debuggerStateSubject.next({ services: [] });
          } else {
            // When attaching, emit to sharedService to trigger updates in storage nodes
            this.serviceApi.getSouthServices(false)
              .pipe(takeUntil(this.destroy$))
              .subscribe((data: any) => {
                this.sharedService.debuggerStateSubject.next({ services: data.services || [] });
              });
          }
        }
        this.ngProgress.done();
        this.alertService.success(res['message'], true);
        // Retry to fetch the service and verify the new debugger state
        this.getDebuggerStateChanges(expectedState);
        this.cdr.detectChanges();
      }, error => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText, true);
        }
      });
  }

  suspendDebugger() {
    // Don't allow suspend if already suspended
    if (this.data?.debug?.ingress === 'Suspended') {
      return;
    }
    
    this.ngProgress.start();
    const name = this.data.controls.nameControl['name'];
    const payload = { state: 'suspend' };
    this.serviceApi.manageServiceDebuggerState(name, 'suspend', payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        // Update the debugger state to reflect suspension
        if (this.data.debug) {
          this.data.debug.ingress = 'Suspended';
        }
        this.ngProgress.done();
        this.alertService.success(res['message'], true);
        this.cdr.detectChanges();
      }, error => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText, true);
        }
      });
  }

  resumeDebugger() {
    // Don't allow resume if not suspended
    if (this.data?.debug?.ingress !== 'Suspended') {
      return;
    }
    
    this.ngProgress.start();
    const name = this.data.controls.nameControl['name'];
    const payload = { state: 'resume' };
    this.serviceApi.manageServiceDebuggerState(name, 'suspend', payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        // Update the debugger state to reflect resumption
        if (this.data.debug) {
          this.data.debug.ingress = 'Running';
        }
        this.ngProgress.done();
        this.alertService.success(res['message'], true);
        this.cdr.detectChanges();
      }, error => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText, true);
        }
      });
  }

  /**
   * Get the service name for storage node by finding the service with attached debugger
   */
  getServiceNameForStorage(): Promise<string | null> {
    if (this.data.label !== 'Storage' || this.from !== 'south') {
      return Promise.resolve(null);
    }
    
    // Find the service with attached debugger by calling the API
    return this.serviceApi.getSouthServices(false)
      .pipe(
        takeUntil(this.destroy$),
        map((data: any) => {
          const services = data.services || [];
          const serviceWithDebugger = services.find((s: any) => s.debug?.debugger === 'Attached');
          return serviceWithDebugger?.name || null;
        }),
        catchError(() => of(null))
      )
      .toPromise();
  }

  isolateDebugger() {
    // Don't allow isolate if already isolated
    if (this.data?.debug?.egress === 'Isolated') {
      return;
    }
    
    this.ngProgress.start();
    this.getServiceNameForStorage()
      .then(serviceName => {
        if (!serviceName) {
          this.ngProgress.done();
          this.alertService.error('Service with attached debugger not found', true);
          return;
        }
        
        const payload = { state: 'discard' };
        this.serviceApi.manageServiceDebuggerState(serviceName, 'isolate', payload)
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            // Update the debugger state to reflect isolation
            if (this.data.debug) {
              this.data.debug.egress = 'Isolated';
            }
            this.ngProgress.done();
            this.alertService.success(res['message'], true);
            this.cdr.detectChanges();
          }, error => {
            this.ngProgress.done();
            if (error.status === 0) {
              console.log('service down ', error);
            } else {
              this.alertService.error(error.statusText, true);
            }
          });
      });
  }

  storeDebugger() {
    // Don't allow store if not isolated
    if (this.data?.debug?.egress !== 'Isolated') {
      return;
    }
    
    this.ngProgress.start();
    this.getServiceNameForStorage()
      .then(serviceName => {
        if (!serviceName) {
          this.ngProgress.done();
          this.alertService.error('Service with attached debugger not found', true);
          return;
        }
        
        const payload = { state: 'store' };
        this.serviceApi.manageServiceDebuggerState(serviceName, 'isolate', payload)
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            // Update the debugger state to reflect storage
            if (this.data.debug) {
              this.data.debug.egress = 'Storage';
            }
            this.ngProgress.done();
            this.alertService.success(res['message'], true);
            this.cdr.detectChanges();
          }, error => {
            this.ngProgress.done();
            if (error.status === 0) {
              console.log('service down ', error);
            } else {
              this.alertService.error(error.statusText, true);
            }
          });
      });
  }

  getDebuggerStateChanges(expectedState: string) {
    const maxRetries = 3;
    let attempt = 0;
    const poll$ = interval(2000).pipe( // poll every 2 seconds
      take(maxRetries),
      switchMap(() => {
        attempt++;
        const type = this.from === 'south' ? 'Southbound' : 'Northbound';
        return this.serviceApi.getServiceByType(type).pipe(
          catchError(err => {
            console.error(`Error on attempt ${attempt}:`, err);
            return of(null); // swallow error and continue polling
          })
        );
      })
    );

    const subscription = poll$.subscribe((res: any) => {
      if (!res) return;
      if (this.data.controls.nameControl) {
        const name = this.data.controls.nameControl['name'];
        const service = res['services'].find((s: any) => s.name === name);
        const currentState = service?.debug?.debugger;

        if (currentState === expectedState) {
          this.data.debug = { ...service.debug };
          this.data.controls.debugControl['debug'] = { ...service.debug };
          const name = this.data.controls.nameControl['name'];
          this.sharedService.debuggerStateSubject.next({ service: name, debug: this.data.debug });
          this.cdr.detectChanges();
          // Success: update and stop polling
          subscription.unsubscribe();
          this.alertService.success(`Debugger ${service.debug.debugger.toLowerCase()} successfully.`, true);
        }

        if (attempt > maxRetries) {
          // Max retries hit
          this.alertService.error('Debugger state failed to update. Please refresh.', true);
          subscription.unsubscribe();
        }
      }
    });
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

  toggleDataDisplay() {
    this.isDataDisplayVisible = !this.isDataDisplayVisible;
    // Emit to flowEditorService to show/hide data display nodes
    this.flowEditorService.showDebuggerDataDisplay.next(this.isDataDisplayVisible);
    this.cdr.detectChanges();
  }

  /**
   * Parse debug data into table rows for display
   * Data structure: JSON object with "name" field matching filter node name, containing a "readings" array
   * Each reading item has: user_ts, asset_code, and a readings subobject with key/value pairs
   */
  parseDebugDataForTable(data: any): any[] {
    if (!data) {
      console.log('parseDebugDataForTable: No data provided');
      return [];
    }

    console.log('parseDebugDataForTable: Input data:', data);

    const rows: any[] = [];
    let currentDate = '';

    // The data should be a JSON object that was matched by name
    // It should have a "readings" array property
    let readingsArray: any[] = [];
    
    if (data && typeof data === 'object') {
      if (Array.isArray(data.readings)) {
        // Data has a readings array property - this is what we want
        readingsArray = data.readings;
      } else if (Array.isArray(data)) {
        // Data itself is an array (might be the readings array)
        readingsArray = data;
      } else {
        // Data is an object but no readings array found
        console.warn('parseDebugDataForTable: No readings array found in data:', data);
        return [];
      }
    } else {
      console.warn('parseDebugDataForTable: Invalid data type:', typeof data);
      return [];
    }

    console.log('parseDebugDataForTable: Readings array length:', readingsArray.length);

    // Process each reading item in the readings array
    readingsArray.forEach((item: any) => {
      if (!item) return;

      // Extract user_ts (timestamp) - this is the key field
      const userTs = item.user_ts || '';
      if (!userTs) {
        console.warn('parseDebugDataForTable: Item missing user_ts:', item);
        return;
      }

      // Extract date (portion before space) and time (portion after space)
      const spaceIndex = userTs.indexOf(' ');
      const date = spaceIndex > 0 ? userTs.substring(0, spaceIndex) : userTs;
      let time = spaceIndex > 0 ? userTs.substring(spaceIndex + 1) : '';
      
      // Remove timezone information (e.g., "+00:00" or "-05:00")
      // Look for patterns like "+HH:MM" or "-HH:MM" at the end
      const timezonePattern = /[+-]\d{2}:\d{2}$/;
      time = time.replace(timezonePattern, '');

      // Extract asset code
      const assetCode = item.asset_code || item.assetCode || item.asset || '';

      // Extract reading object - note: it's "reading" (singular), not "readings"
      // The reading object contains key/value pairs
      const reading = item.reading || item.readings || {};
      
      if (Object.keys(reading).length === 0) {
        console.warn('parseDebugDataForTable: Item has no reading object:', item);
        return;
      }

      // Add date row if date changed
      if (date !== currentDate) {
        rows.push({
          type: 'date',
          date: date,
          colspan: 4
        });
        currentDate = date;
      }

      // Add rows for each reading key/value pair
      Object.keys(reading).forEach((key) => {
        rows.push({
          type: 'reading',
          date: date,
          time: time,
          assetCode: assetCode || 'N/A',
          readingKey: key,
          readingValue: reading[key]
        });
      });
    });

    console.log('parseDebugDataForTable: Generated rows:', rows.length);
    return rows;
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
