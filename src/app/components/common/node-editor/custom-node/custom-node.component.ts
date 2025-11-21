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
  isDebuggerAttached: boolean = false;  // Track if debugger is attached to pipeline
  isFilterWatched: boolean = false;  // Track if this filter node is being watched
  isStorageWatched: boolean = false;  // Track if this storage node is being watched

  @HostBinding("class.selected") get selected() {
    return this.data.selected;
  }

  /**
   * Getter to check if eye icon should be shown (with logging)
   */
  get shouldShowEyeIcon(): boolean {
    if (this.data?.label === 'Filter' && !(this.data as Filter).pseudoNode) {
      const shouldShow = this.isDebuggerAttached;
      return shouldShow;
    }
    return false;
  }

  /**
   * Method to log when template renders (called from template)
   */
  logTemplateRender(): boolean {
    if (this.data?.label === 'Filter' && !(this.data as Filter).pseudoNode) {
    }
    return false; // Don't render anything
  }

  /**
   * Getter to check if eye icon should be visible for storage nodes
   */
  get shouldShowEyeIconForStorage(): boolean {
    // Show on storage nodes when debugger is attached
    const isStorage = this.data?.label === 'Storage';
    if (!isStorage) {
      return false;
    }
    
    return this.isDebuggerAttached;
  }

  /**
   * Getter to check if eye icon should be visible (for debugging)
   */
  get shouldShowEyeIconForFilter(): boolean {
    // Check if this is a Filter node by checking if it has filter-specific controls
    // Note: data.label is changed to the filter name in ngOnChanges, so we can't use that
    // Instead, check if it has filterColorControl which is unique to filter nodes
    const hasFilterColorControl = !!(this.data as any)?.controls?.filterColorControl;
    const hasNameControl = !!(this.data as any)?.controls?.nameControl;
    const filterName = this.data?.controls?.nameControl?.['name'];
    
    // Check if this is the special "Filter" node used to add new filters
    // This node has label "Filter" and no actual filter name
    const isAddFilterNode = this.data?.label === 'Filter' && (!filterName || filterName === 'Filter' || filterName === '');
    
    // A filter node in the pipeline has filterColorControl and a name that's not "Filter"
    const isFilterNode = hasFilterColorControl && hasNameControl && filterName && filterName !== 'Filter';
    
    if (!isFilterNode && !isAddFilterNode) {
      return false; // Not a filter node at all
    }
    
    // Exclude the "Filter" add node and pseudo nodes
    if (isAddFilterNode) {
      return false; // Don't show on the add filter node
    }
    
    const isPseudoNode = (this.data as Filter)?.pseudoNode === true;
    if (isPseudoNode) {
      return false; // Don't show on pseudo nodes
    }
    
    // Check if node has connections on both input and output ports
    let hasInputConnection = false;
    let hasOutputConnection = false;
    
    try {
      const connections = editor.getConnections();
      
      // Check for input connections (connections where this node is the target)
      hasInputConnection = connections.some((conn: any) => 
        conn.target === this.data.id
      );
      
      // Check for output connections (connections where this node is the source)
      hasOutputConnection = connections.some((conn: any) => 
        conn.source === this.data.id
      );
    } catch (e) {
      console.warn('[Filter Node] Error checking connections:', e);
    }
    
    return hasInputConnection && hasOutputConnection && this.isDebuggerAttached;
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

    // Monitor debugger state to determine if debugger is attached
    this.sharedService.debuggerStateSubject
      .pipe(takeUntil(this.destroy$))
      .subscribe((debuggerState: any) => {
        if (debuggerState?.debug?.debugger === 'Attached') {
          this.isDebuggerAttached = true;
          this.cdr.markForCheck();
          this.cdr.detectChanges();
          // Force another change detection cycle for filter/storage nodes
          if (this.data?.label === 'Filter' || this.data?.label === 'Storage') {
            setTimeout(() => {
              this.cdr.markForCheck();
              this.cdr.detectChanges();
            }, 0);
          }
        } else if (debuggerState?.services && Array.isArray(debuggerState.services)) {
          // Check services array if provided
          const hasAttachedDebugger = debuggerState.services.some((s: any) => s.debug?.debugger === 'Attached');
          const wasAttached = this.isDebuggerAttached;
          this.isDebuggerAttached = hasAttachedDebugger;
          // Always trigger change detection for filter/storage nodes when debugger state changes
          if (this.data?.label === 'Filter' || this.data?.label === 'Storage' || wasAttached !== hasAttachedDebugger) {
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          }
        } else if (debuggerState && !debuggerState.debug && !debuggerState.services) {
          // Debugger state cleared - set to false
          if (this.isDebuggerAttached) {
            this.isDebuggerAttached = false;
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          }
        }
      });

    // Subscribe to filter watch state changes
    this.subscribeToFilterWatchState();
    
    // Subscribe to storage watch state changes
    this.subscribeToStorageWatchState();

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

          // For filter nodes, check if debugger attachment state has changed
          if (this.data.label === 'Filter') {
            const hasAttachedDebugger = curr.services.some((s: any) => s.debug?.debugger === 'Attached');
            return this.isDebuggerAttached === hasAttachedDebugger;
          }

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

        // Update isDebuggerAttached for all nodes (including filters and storage) when services are available
        if (servicesResponse.services && Array.isArray(servicesResponse.services)) {
          const hasAttachedDebugger = servicesResponse.services.some((s: any) => s.debug?.debugger === 'Attached');
          const wasAttached = this.isDebuggerAttached;
          this.isDebuggerAttached = hasAttachedDebugger;
          // Always trigger change detection for filter/storage nodes when debugger state is checked
          if (this.data?.label === 'Filter' || this.data?.label === 'Storage' || wasAttached !== hasAttachedDebugger) {
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          }
        }
        
        // Handle storage nodes
        if (this.data.label === 'Storage' && this.from === 'south') {
          // Check if we have a services array or a single service update
          let serviceWithDebugger = null;
          if (servicesResponse.services && Array.isArray(servicesResponse.services)) {
            // Full services array update
            serviceWithDebugger = servicesResponse.services.find((s: any) => s.debug?.debugger === 'Attached');
          } else if (servicesResponse.service && servicesResponse.debug) {
            // Single service update - check if it's attached
            if (servicesResponse.debug.debugger === 'Attached') {
              serviceWithDebugger = { debug: servicesResponse.debug };
            }
          }
          
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
            // Only reset to Detached if we have a services array and no attached debugger
            // Don't reset on single service updates that aren't for storage
            if (servicesResponse.services && Array.isArray(servicesResponse.services)) {
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
          }
          
          return;
        }

        // Handle service nodes
        if (!this.data?.controls?.nameControl?.['name'] || !this.data?.debug) {
          // Filter nodes don't have debug state, but we've already updated isDebuggerAttached above
          return;
        }

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

        // Update isDebuggerAttached based on services array (for all node types)
        if (servicesResponse.services && Array.isArray(servicesResponse.services)) {
          const hasAttachedDebugger = servicesResponse.services.some((s: any) => s.debug?.debugger === 'Attached');
          if (this.isDebuggerAttached !== hasAttachedDebugger) {
            this.isDebuggerAttached = hasAttachedDebugger;
            this.cdr.detectChanges();
          }
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

    // Check if this filter node is already being watched
    // Check by filterColorControl since label gets changed to filter name
    const hasFilterColorControl = !!(this.data as any)?.controls?.filterColorControl;
    const filterName = this.data?.controls?.nameControl?.['name'];
    const isAddFilterNode = this.data?.label === 'Filter' && (!filterName || filterName === 'Filter' || filterName === '');
    
    if (hasFilterColorControl && !isAddFilterNode && !(this.data as Filter).pseudoNode) {
      // Check if there's already a debug display node for this filter
      const nodes = editor.getNodes();
      const watchNode = nodes.find((n: any) => 
        n.type === 'debug-data-display' && (n as any).filterNodeId === this.data.id
      );
      this.isFilterWatched = !!watchNode;
      
      // Also check if debugger is attached by checking services/tasks
      // This will be updated by the subscription, but set initial state
      if (!this.isDebuggerAttached) {
        // Check if any service/task has debugger attached
        // This is a fallback check - the subscription will update it properly
      }
    }

    // Check if this storage node is already being watched
    if (this.data.label === 'Storage') {
      const nodes = editor.getNodes();
      const watchNode = nodes.find((n: any) => 
        n.type === 'debug-data-display' && (n as any).storageNodeId === this.data.id
      );
      this.isStorageWatched = !!watchNode;
      console.log('[Storage Node] ngOnChanges - isStorageWatched:', this.isStorageWatched, 'nodeId:', this.data.id);
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
      if (this.from == 'south') {
        if (this.data?.controls?.debugControl) {
          this.data.debug = this.data?.controls?.debugControl['debug'];
        } else if (!this.data.debug) {
          // Initialize debug object if it doesn't exist
          this.data.debug = {
            debugger: 'Detached',
            ingress: 'Running',
            egress: 'Storage'
          };
        }
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
   * Replay the debugger buffer data
   */
  replayDebugger() {
    // Only allow replay when debugger is attached and ingress is suspended
    if (this.data?.debug?.debugger !== 'Attached' || this.data?.debug?.ingress !== 'Suspended') {
      return;
    }
    
    this.ngProgress.start();
    const name = this.data.controls.nameControl['name'];
    this.serviceApi.manageServiceDebuggerState(name, 'replay')
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.ngProgress.done();
        this.alertService.success(res['message'], true);
        
        // After 2 seconds, trigger refresh of debug data display nodes
        setTimeout(() => {
          this.flowEditorService.refreshDebugDisplayNodes.next(true);
        }, 2000);
        
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
      return [];
    }

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
        return [];
      }
    } else {
      return [];
    }

    // Process each reading item in the readings array
    readingsArray.forEach((item: any) => {
      if (!item) return;

      // Extract user_ts (timestamp) - this is the key field
      const userTs = item.user_ts || '';
      if (!userTs) {
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

    return rows;
  }

  /**
   * Toggle watch state for filter node
   */
  toggleFilterWatch() {
    // Check if this is a filter node by checking for filterColorControl
    const hasFilterColorControl = !!(this.data as any)?.controls?.filterColorControl;
    const filterName = this.data?.controls?.nameControl?.['name'];
    const isAddFilterNode = this.data?.label === 'Filter' && (!filterName || filterName === 'Filter' || filterName === '');
    
    if (!hasFilterColorControl || isAddFilterNode) {
      return;
    }
    
    // Type guard to check if it's a Filter node
    const filterNode = this.data as Filter;
    if (filterNode.pseudoNode) {
      return;
    }
    
    // Check if a watch node already exists for this filter
    const nodes = editor.getNodes();
    const existingWatchNode = nodes.find((n: any) => 
      n.type === 'debug-data-display' && (n as any).filterNodeId === this.data.id
    );
    
    // Toggle the watch state
    this.isFilterWatched = !!existingWatchNode;
    this.isFilterWatched = !this.isFilterWatched; // Toggle it
    
    // Emit event to node-editor component to create/remove debug display node
    this.flowEditorService.toggleFilterWatch.next({
      filterNodeId: this.data.id,
      filterNodeName: filterName,
      isWatched: this.isFilterWatched,
      filterNode: this.data
    });
  }

  /**
   * Toggle watch state for storage node
   */
  toggleStorageWatch() {
    if (this.data.label !== 'Storage') {
      return;
    }
    
    // Check if a watch node already exists for this storage node
    const nodes = editor.getNodes();
    const existingWatchNode = nodes.find((n: any) => 
      n.type === 'debug-data-display' && (n as any).storageNodeId === this.data.id
    );
    
    // Toggle the watch state
    this.isStorageWatched = !!existingWatchNode;
    this.isStorageWatched = !this.isStorageWatched; // Toggle it
    
    // Emit event to node-editor component to create/remove debug display node
    this.flowEditorService.toggleStorageWatch.next({
      storageNodeId: this.data.id,
      isWatched: this.isStorageWatched,
      storageNode: this.data
    });
  }

  /**
   * Subscribe to filter watch state changes to sync icon state
   */
  private subscribeToFilterWatchState() {
    this.flowEditorService.filterWatchStateChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((watchState: any) => {
        if (watchState && watchState.filterNodeId === this.data.id) {
          this.isFilterWatched = watchState.isWatched;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Subscribe to storage watch state changes to sync icon state
   */
  private subscribeToStorageWatchState() {
    this.flowEditorService.storageWatchStateChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((watchState: any) => {
        if (watchState && watchState.storageNodeId === this.data.id) {
          this.isStorageWatched = watchState.isWatched;
          this.cdr.detectChanges();
        }
      });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
