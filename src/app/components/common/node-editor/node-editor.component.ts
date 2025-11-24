import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Injector, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { cloneDeep, isEmpty } from 'lodash';
import { EMPTY, Subject, Subscription, forkJoin, interval, of } from 'rxjs';
import { catchError, delay, map, mergeMap, repeatWhen, skip, take, takeUntil, takeWhile } from 'rxjs/operators';
import { DocService } from '../../../services/doc.service';
import Utils, { MAX_INT_SIZE, POLLING_INTERVAL } from '../../../utils';
import { AdditionalServicesUtils } from '../../core/developer/additional-services/additional-services-utils.service';
import { NorthTask } from '../../core/north/north-task';
import { Notification } from '../../core/notifications/notification';
import { ServiceConfigComponent } from '../../core/notifications/service-config/service-config.component';
import { ServiceWarningComponent } from '../../core/notifications/service-warning/service-warning.component';
import { Service } from '../../core/south/south-service';
import { DialogService } from '../confirmation-dialog/dialog.service';
import {
  AlertService,
  AssetsService, ConfigurationControlService, ConfigurationService, FileUploaderService,
  FilterService, GenerateCsvService, NorthService,
  NotificationsService,
  PingService, ProgressBarService,
  ResponseHandler, RolesService,
  SchedulesService,
  ServicesApiService,
  SharedService,
  ToastService
} from './../../../services';
import {
  createEditor, deleteConnection, getUpdatedFilterPipeline,
  removeNode, updateFilterNode, updateNode, applyContentReordering,
  undoAction, redoAction, resetNodes,
  editor,
  history,
  getNodeView,
  area,
  connectionEvents,
} from './editor';
import { FlowEditorService, NodeStatus } from './flow-editor.service';
import { DebuggerReadingsComponent } from '../../core/debugger/debugger-readings/debugger-readings.component';
import { DebugDataDisplay } from './nodes/debug-data-display';
import { ClassicPreset } from 'rete';
import { Connection } from './connection';

@Component({
  selector: 'app-node-editor',
  templateUrl: './node-editor.component.html',
  styleUrls: ['./node-editor.component.css']
})
export class NodeEditorComponent implements OnInit {
  @ViewChild(ServiceWarningComponent, { static: true }) notificationServiceWarningComponent: ServiceWarningComponent;
  @ViewChild(ServiceConfigComponent, { static: true }) notificationServiceConfigComponent: ServiceConfigComponent;
  @ViewChild("rete") container!: ElementRef;
  @ViewChild(DebuggerReadingsComponent, { static: false }) debuggerReadingsComp: DebuggerReadingsComponent;

  public source = '';
  public from = '';
  public filterPipeline = [];
  public updatedFilterPipeline = [];
  public filterConfigurations: any[] = [];
  public category: any;
  public filterCategory: any;
  private subscription: Subscription;
  private filterSubscription: Subscription;
  private connectionSubscription: Subscription;
  private serviceSubscription: Subscription;
  private serviceStatusSubscription: Subscription;
  private removeFilterSubscription: Subscription;
  private exportReadingSubscription: Subscription;
  private serviceDetailsSubscription: Subscription;
  private logsSubscription: Subscription;
  private paramsSubscription: Subscription;
  private nodeClickSubscription: Subscription;
  private nodeDropdownClickSubscription: Subscription;
  private pipelineSubscription: Subscription;
  private debuggerStateSubscription: Subscription;
  private debugDisplayRefreshSubscription: Subscription;

  showPluginConfiguration: boolean = false;
  showFilterConfiguration: boolean = false;
  showLogs: boolean = false;
  debugger: any = {};
  debuggerPage = false;

  showNotificationConfiguration = false;
  showTaskSchedule = false;
  showReadings = false;
  service: Service;
  readingService: Service;
  task: NorthTask;
  notification: Notification;
  services: Service[] = [];
  tasks: NorthTask[] = [];
  notifications: Notification[] = [];
  destroy$: Subject<boolean> = new Subject<boolean>();
  debugDataDisplayNodes: any[] = [];
  bufferData: any = null;
  socket: ClassicPreset.Socket;
  serviceName = '';
  filterName = '';
  dialogServiceName = '';
  isfilterPipelineFetched = false;
  selectedConnectionId = "";
  changedConfig: any;
  changedFilterConfig: any;
  pluginConfiguration;

  filterPluginConfiguration;
  advancedConfiguration = [];
  public reenableButton = new EventEmitter<boolean>(false);
  apiCallsStack = [];
  initialApiCallsStack = [];
  filterConfigApiCallsStack = [];
  validConfigurationForm = true;
  validFilterConfigForm = true;
  validNotificationForm = true;
  validDeliveryConfigForm = true;
  validRuleConfigForm = true;
  quickviewFilterName = "";
  isAddFilterWizard: boolean = false;
  isAlive: boolean;

  notificationChangedConfig: any;
  rulePluginChangedConfig: any;
  ruleCategory: any;
  deliveryCategory: any;
  deliveryPluginChangedConfig: any;
  ruleConfiguration: any;
  deliveryConfiguration: any;
  serviceInfo = { added: false, type: '', isEnabled: true, process: '', name: '', isInstalled: false, isAvailable: false };
  btnText = '';

  taskSchedule = { id: '', name: '', exclusive: false, repeatTime: '', repeatDays: 0 };
  selectedAsset = '';
  MAX_RANGE = MAX_INT_SIZE / 2;
  isSidebarCollapsed: boolean;
  nodesToDelete = [];
  selectedFilters = [];
  historyData = { showUndo: false, showRedo: false };

  filter: NodeStatus;
  scheduleChangedState = false;

  constructor(public injector: Injector,
    private route: ActivatedRoute,
    private cdRf: ChangeDetectorRef,
    private filterService: FilterService,
    private servicesApiService: ServicesApiService,
    private notificationsService: NotificationsService,
    private configService: ConfigurationService,
    public flowEditorService: FlowEditorService,
    private configurationControlService: ConfigurationControlService,
    private fileUploaderService: FileUploaderService,
    private toastService: ToastService,
    private alertService: AlertService,
    public rolesService: RolesService,
    private response: ResponseHandler,
    public ngProgress: ProgressBarService,
    private dialogService: DialogService,
    private northService: NorthService,
    private ping: PingService,
    private assetService: AssetsService,
    public generateCsv: GenerateCsvService,
    private docService: DocService,
    private schedulesService: SchedulesService,
    private additionalServicesUtils: AdditionalServicesUtils,
    public sharedService: SharedService,
    private router: Router) {
    this.sharedService.isSidebarCollapsed
      .pipe(takeUntil(this.destroy$))
      .subscribe((isCollapsed: boolean) => {
        this.isSidebarCollapsed = isCollapsed;
      });

    this.route.params.subscribe(params => {
      this.from = params.from;
      this.source = params.name;
      if (this?.from === 'south') {
        this.createApiCallStack('south');
      }
      if (this?.from === 'north') {
        this.createApiCallStack('north');
      }
      if (this?.from === 'notifications') {
        // If we are redirecting back after enabling/disabling/adding the service then no need to make all calls again
        this.paramsSubscription = this.route.paramMap
          .pipe(map(() => window.history.state)).subscribe((data: any) => {
            if (!data?.shouldSkipCalls) {
              this.additionalServicesUtils.getAllServiceStatus(false, 'notification');
            }
          })
        // Issue may cause by refreshing the page because of old state data, so need to update history state
        window.history.replaceState({ shouldSkipCalls: false }, '');
        this.createApiCallStack('notifications');
      }

      if (this?.from !== 'notifications' && this.source) {
        this.createApiCallStack('filter');
      }
    });
  }

  refreshServiceInfo() {
    this.additionalServicesUtils.getAllServiceStatus(false, 'notification');
  }

  /**
   * Clear stale configuration data when switching between services
   */
  private clearConfigurationData() {
    this.changedConfig = null;
    this.changedFilterConfig = null;
    this.category = null;
    this.filterCategory = null;
    this.pluginConfiguration = null;
    this.filterPluginConfiguration = null;
    this.advancedConfiguration = [];
    this.notificationChangedConfig = null;
    this.rulePluginChangedConfig = null;
    this.deliveryPluginChangedConfig = null;
    this.ruleCategory = null;
    this.deliveryCategory = null;
    this.ruleConfiguration = null;
    this.deliveryConfiguration = null;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydownHandler(event) {
    // Prevent actions when the focus is inside QuickviewComponent
    const quickView = document.getElementById('quickviewDefault');
    if (quickView?.classList.contains('is-active')) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.keyCode == 90) {
      undoAction(this.flowEditorService);
    }
    if ((event.ctrlKey || event.metaKey) && event.keyCode == 89) {
      redoAction(this.flowEditorService);
    }
    if (event.keyCode == 32) {
      resetNodes(this.flowEditorService);
    }
    if ((event.key === 'Delete' || (event.key == 'Backspace' && event.metaKey)) && this.nodesToDelete.length !== 0) {
      this.onDelete();
    }
  }

  ngOnInit(): void {
    this.pipelineSubscription = this.flowEditorService.updatedFilterPipelineData$.subscribe(
      (pipeline: (string | string[])[]) => {
        if (pipeline) {
          this.updatedFilterPipeline = pipeline;
        }
      }
    );

    this.debuggerStateSubscription = this.flowEditorService.openDebuggerInQuickview.subscribe(data => {
      this.debuggerPage = data.openDebuggerPage;
      this.debugger = { debug: data.debugger, serviceName: data.serviceName };
      this.showNotificationConfiguration = false;
      this.showPluginConfiguration = false;
      this.showFilterConfiguration = false;
      this.showTaskSchedule = false;
      this.showReadings = false;
      this.showLogs = false;
    });


    this.logsSubscription = this.flowEditorService.showLogsInQuickview.subscribe(data => {
      this.clearConfigurationData();

      this.showLogs = data.showLogs ? true : false;
      this.notification = data?.notification;
      this.serviceName = data?.serviceName ? data.serviceName : this.notification?.name;
      this.showNotificationConfiguration = false;
      this.showPluginConfiguration = false;
      this.showFilterConfiguration = false;
      this.showTaskSchedule = false;
      this.showReadings = false;
      this.debuggerPage = false;
    });

    this.subscription = this.flowEditorService.showItemsInQuickview.pipe(skip(1)).subscribe(data => {
      if (this.from === 'notifications') {
        this.showLogs = false;
        this.showNotificationConfiguration = data.showNotificationConfiguration ? true : false;
        this.notification = data?.notification;
        this.serviceName = data.notification.name;
        this.clearConfigurationData();

        if (this.showNotificationConfiguration) {
          this.getCategory();
          this.getRuleConfiguration();
          this.getDeliveryConfiguration();
        }
        return;
      }
      this.clearConfigurationData();
      this.showPluginConfiguration = data.showPluginConfiguration ? true : false;
      this.showFilterConfiguration = data.showFilterConfiguration ? true : false;
      this.showTaskSchedule = data.showTaskSchedule ? true : false;
      this.showReadings = data.showReadings ? true : false;
      this.serviceName = data?.serviceName;
      this.showLogs = false;
      this.debuggerPage = false;

      if (this.showPluginConfiguration || this.showNotificationConfiguration) {
        this.getCategory();
      }
      if (this.showTaskSchedule) {
        const task = this.tasks.find(t => t.name == data.serviceName);
        const repeatInterval = Utils.secondsToDhms(task.repeat);
        this.taskSchedule = {
          id: task.id,
          name: task.name,
          exclusive: task.exclusive,
          repeatDays: repeatInterval.days,
          repeatTime: repeatInterval.time
        }
      }
      if (this.showFilterConfiguration) {
        this.quickviewFilterName = data.filterName;
        this.getFilterCategory()
      }
      if (this.showReadings) {
        this.readingService = this.services.find(service => (service.name == this.serviceName));
      }
    });

    this.filterSubscription = this.flowEditorService.filterInfo.pipe(skip(1)).subscribe(data => {
      if (data.name !== "newPipelineFilter") {
        this.openModal('delete-filter-dialog');
        this.filterName = data.name;
      }
      else {
        if (this.isfilterPipelineFetched) {
          let updatedPipeline = getUpdatedFilterPipeline();
          if (updatedPipeline?.length > 0) {
            this.updatedFilterPipeline = updatedPipeline;
            this.flowEditorService.pipelineInfo.next(this.updatedFilterPipeline);
            this.isAddFilterWizard = true;
          }
        }
      }
    });

    this.connectionSubscription = this.flowEditorService.connectionInfo.subscribe(data => {
      if (data.selected) {
        this.selectedConnectionId = data.id;
      }
      else {
        this.selectedConnectionId = "";
      }
    });

    this.serviceSubscription = this.flowEditorService.serviceInfo.pipe(skip(1)).subscribe(data => {
      this.dialogServiceName = data.name;
      if (!data.buttonText) {
        this.openModal('delete-service-dialog');
      } else {
        this.openModal('state-change-dialog');
        this.btnText = data.buttonText;
      }
    });

    this.serviceStatusSubscription = this.flowEditorService.updateNodeStatusSubject.pipe(skip(1)).subscribe((data: NodeStatus) => {
      this.filter = null;
      this.dialogServiceName = data.name;
      this.scheduleChangedState = data.newState;
      this.service = this.services?.find(service => service.name == data.name);
      this.task = this.tasks?.find(task => task.name == data.name);
      if (data.type == 'filter') {
        this.filter = { name: data.name, category: data.category, newState: data.newState, oldState: data.oldState }
      }
    });

    this.exportReadingSubscription = this.flowEditorService.exportReading.pipe(skip(1)).subscribe(data => {
      let service = this.services.find(service => (service.name == data.serviceName));
      this.getAssetReadings(service);
    });

    this.nodeClickSubscription = this.flowEditorService.nodeClick.pipe(skip(1)).subscribe(data => {
      // Currently not possible to delete multiple connections
      if (data.source && data.target) {
        this.nodesToDelete.push({ id: data.id, 'label': 'Connection' });
      }
      if (data.label !== 'Storage' && data.label !== 'Filter') {
        if (!(data.source && data.target)) {
          let view = getNodeView(data.id);
          data['dragStartPosition'] = view?.position;
        }
        if (data.selected && !this.nodesToDelete?.some(node => (node.id == data.id))) {
          if (data.isFilterNode) {
            if (!this.selectedFilters.some(filter => filter === data.label)) {
              this.selectedFilters.push(data.label);
            }
          }
          // Add null check for nameControl to prevent errors with debug display nodes
          const nodeName = data.controls?.nameControl?.['name'] || data.label || '';
          this.nodesToDelete.push({ id: data.id, 'label': data.label, 'name': nodeName });
        }
        else if (!data.selected) {
          const nodesToDelete = this.nodesToDelete.filter(node => node.id !== data.id);
          this.nodesToDelete = nodesToDelete;

          const selectedFilters = this.selectedFilters.filter(filter => filter !== data.label);
          this.selectedFilters = selectedFilters;
        }
      }
    })

    this.nodeDropdownClickSubscription = this.flowEditorService.nodeDropdownClick.pipe(skip(1)).subscribe(data => {
      applyContentReordering(data.nodeId);
    })

    this.isAlive = true;
    this.ping.pingIntervalChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((timeInterval: number) => {
        if (timeInterval === -1) {
          this.isAlive = false;
        }
      });

    interval(POLLING_INTERVAL)
      .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
      .subscribe(() => {
        if (this.from == 'north') {
          this.getNorthTasks(true);
        }
        if (this.from == 'south') {
          this.getSouthservices(true);
        }
      });
    this.removeFilterSubscription = this.flowEditorService.removeFilter.pipe(skip(1)).subscribe(data => {
      if (data) {
        removeNode(data.id);
      }
    })
    this.flowEditorService.checkHistory.subscribe(data => {
      this.historyData = data;
    });


    this.sharedService.bufferReadings
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        if (data?.show && this.debuggerReadingsComp) {
          this.debuggerReadingsComp.serviceName = this.service.name;
          this.debugger = { debug: this.service.debug, serviceName: this.service.name };
          const node = editor.getNode(data.nodeId)?.controls.nameControl['name'];
          this.debuggerReadingsComp.debuggerData = { debug: this.debugger, serviceName: this.service.name, node: node };
          this.debuggerReadingsComp.toggleModal(true);
        }
        this.debuggerPage = false;
        this.showPluginConfiguration = false;
        this.showFilterConfiguration = false;
        this.showTaskSchedule = false;
        this.showNotificationConfiguration = false;
      });

    // Subscribe to showDebuggerDataDisplay to create/remove debug data display nodes
    this.flowEditorService.showDebuggerDataDisplay
      .pipe(takeUntil(this.destroy$))
      .subscribe((show: boolean) => {
        if (show) {
          this.loadBufferDataAndCreateDataDisplayNodes();
          this.startDebugDisplayAutoRefresh();
        } else {
          this.removeDebugDataDisplayNodes();
          this.stopDebugDisplayAutoRefresh();
        }
      });

    // Subscribe to refreshDebugDisplayNodes to manually refresh debug data display nodes
    this.flowEditorService.refreshDebugDisplayNodes
      .pipe(takeUntil(this.destroy$))
      .subscribe((shouldRefresh: boolean) => {
        if (shouldRefresh) {
          this.refreshDebugDisplayNodes();
        }
      });

    // Subscribe to debuggerDetached to remove all debug display nodes when debugger is detached
    this.flowEditorService.debuggerDetached
      .pipe(takeUntil(this.destroy$))
      .subscribe((detached: boolean) => {
        if (detached) {
          this.removeDebugDataDisplayNodes();
          this.stopDebugDisplayAutoRefresh();
        }
      });

    // Monitor ingress state changes to restart/stop polling
    this.sharedService.debuggerStateSubject
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // If debug display nodes are visible, check if we should start/stop polling
        const areDebugDisplayNodesVisible = this.flowEditorService.showDebuggerDataDisplay.value;
        if (areDebugDisplayNodesVisible) {
          if (this.isIngressNotSuspended()) {
            // Ingress is not suspended, ensure polling is running
            if (!this.debugDisplayRefreshSubscription) {
              this.startDebugDisplayAutoRefresh();
            }
          } else {
            // Ingress is suspended, stop polling
            this.stopDebugDisplayAutoRefresh();
          }
        }
      });

    // Subscribe to filter watch toggle events
    this.flowEditorService.toggleFilterWatch
      .pipe(takeUntil(this.destroy$))
      .subscribe((watchData: any) => {
        if (!watchData) return;
        
        if (watchData.isWatched) {
          this.createFilterWatchNode(watchData.filterNodeId, watchData.filterNodeName, watchData.filterNode);
        } else {
          this.removeFilterWatchNode(watchData.filterNodeId);
        }
      });

    // Subscribe to storage watch toggle events
    this.flowEditorService.toggleStorageWatch
      .pipe(takeUntil(this.destroy$))
      .subscribe((watchData: any) => {
        if (!watchData) return;
        
        if (watchData.isWatched) {
          this.createStorageWatchNode(watchData.storageNodeId, watchData.storageNode);
        } else {
          this.removeStorageWatchNode(watchData.storageNodeId);
        }
      });
  }

  ngAfterViewInit(): void {
    this.updatedFilterPipeline = [];
    const el = this.container.nativeElement;
    if (el) {
      const data = {
        from: this.from,
        source: this.source,
        filterPipeline: this.filterPipeline,
        service: this.service,
        services: this.services,
        task: this.task,
        tasks: this.tasks,
        notification: this.notification,
        notifications: this.notifications,
        isServiceEnabled: this.serviceInfo.isEnabled,
        filterConfigurations: this.filterConfigurations,
      }
      let isServiceExist = true;
      if (this.initialApiCallsStack.length > 0) {
        this.ngProgress.start();
        let retries = 4; // Retries
        forkJoin(this.initialApiCallsStack)
          .pipe(mergeMap(res => {
            // Retry GET tasks call (retries + 1) time when task as a service created, It takes time to populate in the GET tasks response
            if (this.source && this.from == 'north') {
              const tasks = res[0]['tasks'];
              isServiceExist = tasks?.some(t => (t.name == this.source));
              return !isServiceExist && retries > 0 ? EMPTY : of(res);
            }
            return of(res);
          }),
            repeatWhen(notifications => {
              return notifications.pipe(
                delay(1500),
                takeWhile(() => !isServiceExist && retries-- > 0)
              )
            }),
            take(1)
          )
          .subscribe((result) => {
            this.ngProgress.done();
            result?.forEach((r: any) => {
              if (r.status) {
                if (r.status === 404) {
                  this.filterPipeline = [];
                  this.isfilterPipelineFetched = true;
                } else {
                  this.toastService.error(r.statusText);
                }
              } else {
                if (r.tasks) {
                  const tasks = r.tasks as NorthTask[];
                  this.tasks = tasks;
                  this.task = tasks.find(t => (t.name == this.source));
                  data.tasks = tasks;
                  data.task = this.task;
                }
                if (r.services) {
                  const services = r.services as Service[];
                  this.services = services;
                  this.service = services.find(service => (service.name == this.source));
                  data.services = services;
                  data.service = this.service;
                }
                if (r.notifications) {
                  this.serviceDetailsSubscription = this.sharedService.installedServicePkgs.subscribe(service => {
                    if (service.installed) {
                      this.serviceInfo = service.installed;
                      const notifications = r.notifications as Notification[];
                      this.notifications = notifications;
                      this.notification = notifications.find(n => (n.name == this.source));
                      data.notifications = notifications;
                      data.notification = this.notification;

                      this.notifications.map((notification) => {
                        notification.isServiceEnabled = this.serviceInfo.isEnabled;
                        return notification;
                      })
                      data.isServiceEnabled = this.serviceInfo.isEnabled;
                      createEditor(el, this.injector, this.flowEditorService, this.rolesService, this.alertService, data);
                // Store socket reference for debug data display nodes
                this.socket = new ClassicPreset.Socket("socket");
                // Restore debug display nodes state after reload
                this.restoreDebugDisplayNodesStateAfterReload();
                    }
                  });
                }
                if (r.result) {
                  this.filterPipeline = r.result.pipeline as string[];
                  this.isfilterPipelineFetched = true;
                  data.filterPipeline = this.filterPipeline;
                  this.createFilterConfigurationsArray();
                }
              }
            });
            this.initialApiCallsStack = [];
            if (this.filterConfigApiCallsStack.length > 0) {
              forkJoin(this.filterConfigApiCallsStack).subscribe((result) => {
                result.forEach((r: any) => {
                  let filterConfig = { pluginName: r.plugin.value, enabled: r.enable.value, filterName: r.filterName, color: "#F9CB9C" };
                  this.filterConfigurations.push(filterConfig);
                })
                createEditor(el, this.injector, this.flowEditorService, this.rolesService, this.alertService, data);
                // Store socket reference for debug data display nodes
                this.socket = new ClassicPreset.Socket("socket");
                // Restore debug display nodes state after reload
                this.restoreDebugDisplayNodesStateAfterReload();
                this.filterConfigApiCallsStack = [];
              });
            }
            else {
              if (this.from !== 'notifications') {
                createEditor(el, this.injector, this.flowEditorService, this.rolesService, this.alertService, data);
                // Store socket reference for debug data display nodes
                this.socket = new ClassicPreset.Socket("socket");
                // Restore debug display nodes state after reload
                this.restoreDebugDisplayNodesStateAfterReload();
              }
              // Navigate to the list page when service and task not exist
              if ((!data.task && !data.service)) {
                this.router.navigate(['/flow/editor', data.from]);
                return;
              }
            }
          });
      }
    }
    this.cdRf.detectChanges();
  }

  updateFilterConfiguration(data: { name: string, state: boolean, category: string }) {
    this.ngProgress.start();
    this.configService.updateBulkConfiguration(data.category, { enable: String(data.state) })
      .subscribe((filterConfig: any) => {
        if (filterConfig.enable.value == 'true') {
          this.toastService.success(`${this.filter.name} filter enabled`);
        } else {
          this.toastService.success(`${this.filter.name} filter disabled`);
        }
        const filterConf = this.filterConfigurations.find(f => {
          if (f.filterName == data.name) {
            f.enabled = filterConfig.enable.value
            return f;
          }
        })
        if (filterConf) {
          updateFilterNode(filterConf);
        }
        this.closeModal('service-status-dialog');
        this.ngProgress.done();
        this.reenableButton.emit(false);
      },
        (error) => {
          this.reenableButton.emit(false);
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  getChangedNotificationConfig(changedConfiguration: any) {
    this.notificationChangedConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, this.pluginConfiguration);
  }

  getChangedRuleConfig(changedConfiguration: any) {
    this.rulePluginChangedConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, this.ruleConfiguration);
  }

  getChangedDeliveryConfig(changedConfiguration: any) {
    this.deliveryPluginChangedConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, this.deliveryConfiguration);
  }

  getNorthTasks(caching: boolean) {
    this.northService.getNorthTasks(caching)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        const tasks = data as NorthTask[];
        this.tasks = tasks;
        data = {
          from: this.from,
          source: this.source,
          filterPipeline: this.filterPipeline,
          task: this.task,
          tasks: this.tasks,
          filterConfigurations: this.filterConfigurations,
        }
        // refresh node data
        updateNode(data);
        // Emit tasks to debuggerStateSubject so filter nodes can check for debugger attachment
        // Convert tasks to services-like format for consistency
        this.sharedService.debuggerStateSubject.next({ services: tasks || [] });
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  updateDebuggerState(debuggerInfo: any) {
    this.debugger = debuggerInfo;
    const name = debuggerInfo.serviceName;
    this.service = this.services.find(service => (service.name == name));
    if (this.service) {
      this.service.debug = debuggerInfo.debug;
    }
    this.sharedService.debuggerStateSubject.next({ service: name, debug: debuggerInfo.debug });
  }

  getSouthservices(caching: boolean) {
    this.servicesApiService.getSouthServices(caching)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        const services = data.services as Service[];
        this.services = services;
        this.readingService = this.services.find(service => (service.name == this.serviceName));
        data = {
          from: this.from,
          source: this.source,
          filterPipeline: this.filterPipeline,
          service: this.service,
          services: services,
          filterConfigurations: this.filterConfigurations,
        }
        // refresh node data
        updateNode(data);
        // Emit services to debuggerStateSubject so filter nodes can check for debugger attachment
        this.sharedService.debuggerStateSubject.next({ services: services || [] });
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  getNotifications() {
    this.notificationsService.getNotificationInstance()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        const notifications = data.notifications as Notification[];
        this.notifications = notifications;
        this.notification = notifications.find(n => (n.name == this.serviceName));
        data = {
          from: this.from,
          source: this.source,
          notification: this.notification,
          notifications: notifications,
          isServiceEnabled: this.serviceInfo.isEnabled
        }
        // refresh node data
        updateNode(data);
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  createApiCallStack(type: string) {
    if (type == 'south') {
      this.initialApiCallsStack.push(this.servicesApiService.getSouthServices(false)
        .pipe(takeUntil(this.destroy$))
        .pipe(catchError(error => of(error))))
    }
    else if (type == 'north') {
      this.initialApiCallsStack.push(this.northService.getNorthTasks(false)
        .pipe(map(response => ({ tasks: response })), takeUntil(this.destroy$))
        .pipe(catchError(error => of(error))))
    }
    else if (type == 'notifications') {
      this.initialApiCallsStack.push(this.notificationsService.getNotificationInstance()
        .pipe(takeUntil(this.destroy$))
        .pipe(catchError(error => of(error))))
    }
    else if (type == 'filter') {
      this.initialApiCallsStack.push(this.filterService.getFilterPipeline(this.source)
        .pipe(map(response => response))
        .pipe(catchError(error => of(error))))
    }
  }

  public getCategory(): void {
    /** request started */
    this.configService.getCategory(this.serviceName).
      subscribe(
        (data: any) => {
          this.changedConfig = [];
          this.advancedConfiguration = [];
          if (this.from === 'notifications') {
            data.channel['readonly'] = 'true';
            data.rule['readonly'] = 'true';
          }
          this.category = { name: this.serviceName, config: data };
          this.pluginConfiguration = cloneDeep({ name: this.serviceName, config: data });
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        }
      );
  }

  public getRuleConfiguration(): void {
    const notificationName = this.notification['name'];
    this.configService.getCategory(`rule${notificationName}`).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            this.ruleCategory = { key: `rule${notificationName}`, config: data };
            this.ruleConfiguration = cloneDeep({ key: `rule${notificationName}`, config: data });
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

  public getDeliveryConfiguration(): void {
    this.ngProgress.start();
    const notificationName = this.notification['name'];
    this.configService.getCategory(`delivery${notificationName}`).
      subscribe(
        (data) => {
          if (!isEmpty(data)) {
            this.deliveryCategory = { key: `delivery${notificationName}`, config: data };
            this.deliveryConfiguration = cloneDeep({ key: `delivery${notificationName}`, config: data });
          }
          this.ngProgress.done();
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  getFilterCategory() {
    let catName = `${this.source}_${this.quickviewFilterName}`
    this.filterService.getFilterConfiguration(catName).subscribe((data: any) => {
      this.changedFilterConfig = [];
      this.filterCategory = { key: catName, config: data, plugin: data.plugin.value };
      this.filterPluginConfiguration = cloneDeep({ key: catName, config: data, plugin: data.plugin.value });
    },
      error => {
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.toastService.error(error.statusText);
        }
      }
    )
  }

  getFilterConfiguration(filterName: string) {
    let catName = `${this.source}_${filterName}`
    this.filterConfigApiCallsStack.push(this.filterService.getFilterConfiguration(catName)
      .pipe(map((response: any) => {
        response['filterName'] = filterName;
        return response;
      })))
  }

  createFilterConfigurationsArray() {
    let flattenedFilterPipeline = [].concat(...this.filterPipeline)
    flattenedFilterPipeline.forEach((filterName) => {
      this.getFilterConfiguration(filterName)
    })
  }

  deleteFilter() {
    const filteredPipeline = this.filterPipeline
      .map(filter =>
        Array.isArray(filter) ? filter.filter(item =>
          !this.selectedFilters.includes(item)) : filter).filter(filter =>
            // Remove empty arrays or filter that match selectedFilters
            (Array.isArray(filter) && filter.length > 0) ||
            (!Array.isArray(filter) && !this.selectedFilters.includes(filter)));
    this.ngProgress.start();
    this.filterService.updateFilterPipeline({ 'pipeline': filteredPipeline }, this.source)
      .subscribe(() => {
        this.ngProgress.done();
        this.selectedFilters.forEach((filter, index) => {
          this.filterService.deleteFilter(filter).subscribe((data: any) => {
            if (this.selectedFilters.length === index + 1) {
              this.selectedFilters = [];
            }
            this.toastService.success(data.result);
          },
            (error) => {
              this.ngProgress.done();
              if (error.status === 0) {
                console.log('service down ', error);
              } else {
                this.toastService.error(error.statusText);
              }
            });
        });
        setTimeout(() => {
          this.router.navigate(['/flow/editor', this.from, this.source, 'details']);
        }, 1000);
      },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  save() {
    if (this.isPipelineUpdated()) {
      this.updateFilterPipeline();
    }
  }

  updateFilterPipeline() {
    this.ngProgress.start();
    this.filterService.updateFilterPipeline({ 'pipeline': this.updatedFilterPipeline }, this.source)
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.toastService.success(data.result);
        this.flowEditorService.clearEmittedPipelineChanges();
        if (editor) {
          // on reload editor clear the node history
          history?.clear();
        }
        this.updatedFilterPipeline = [];
        if (this.task || this.service) {
          this.router.navigate(['/flow/editor', this.from, this.source, 'details']);
        }
      },
        (error) => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  isPipelineUpdated() {
    function isNestedArray(pipeline) {
      return Array.isArray(pipeline) && pipeline.some(item => Array.isArray(item));
    }

    function deepCompare(filterPipeline, changedFilterPipeline) {
      // Check if both are arrays and have the same length
      if (filterPipeline.length !== changedFilterPipeline.length) return true;

      // Check element by element recursively for deep equality
      for (let i = 0; i < filterPipeline.length; i++) {
        if (Array.isArray(filterPipeline[i]) && Array.isArray(changedFilterPipeline[i])) {
          if (deepCompare(filterPipeline[i], changedFilterPipeline[i])) {
            return true;
          }
        } else if (filterPipeline[i] !== changedFilterPipeline[i]) {
          return true;
        }
      }
      return false;
    }

    if (editor.getNodes().some(n => n.label === 'Filter')) {
      return false;
    }

    // Check for structural differences first
    if (isNestedArray(this.filterPipeline) !== isNestedArray(this.updatedFilterPipeline)) {
      return true; // One is nested, the other is not
    }

    // If structures are the same, check the deep equality of the arrays
    if (deepCompare(this.filterPipeline, this.updatedFilterPipeline)) {
      return true; // Arrays differ in structure or content
    }

    return false;
  }

  saveConfiguration() {
    if (!isEmpty(this.changedConfig) && this.pluginConfiguration?.name) {
      this.updateConfiguration(this.pluginConfiguration.name, this.changedConfig, 'plugin-config');
    }

    if (!isEmpty(this.advancedConfiguration)) {
      this.advancedConfiguration.forEach(element => {
        this.updateConfiguration(element.key, element.config, 'plugin-config');
      });
    }

    if (this.apiCallsStack.length > 0) {
      forkJoin(this.apiCallsStack).subscribe((result) => {
        result.forEach((r: any) => {
          this.reenableButton.emit(false);
          if (r.failed) {
            if (r.error.status === 0) {
              console.log('service down ', r.error);
            } else {
              this.toastService.error(r.error.statusText);
            }
          } else {
            this.response.handleResponseMessage(r.type);
          }
        });
        this.apiCallsStack = [];
        this.getCategory();
      });
    }
  }

  saveFilterConfiguration() {
    if (!isEmpty(this.changedFilterConfig) && this.quickviewFilterName) {
      let catName = `${this.source}_${this.quickviewFilterName}`
      this.updateConfiguration(catName, this.changedFilterConfig, 'filter-config');
    }

    if (this.apiCallsStack.length > 0) {
      forkJoin(this.apiCallsStack).subscribe((result) => {
        result.forEach((r: any) => {
          this.reenableButton.emit(false);
          if (r.failed) {
            if (r.error.status === 0) {
              console.log('service down ', r.error);
            } else {
              this.toastService.error(r.error.statusText);
            }
          } else {
            this.response.handleResponseMessage(r.type);
          }
        });
        this.apiCallsStack = [];
        this.getFilterCategory();
      });
    }
  }

  saveNotificationConfiguration() {
    if (!isEmpty(this.notificationChangedConfig) && this.pluginConfiguration?.name) {
      this.updateConfiguration(this.pluginConfiguration?.name, this.notificationChangedConfig, 'plugin-config');
    }
    if (!isEmpty(this.ruleCategory) && this.ruleCategory?.key) {
      this.updateConfiguration(this.ruleCategory?.key, this.rulePluginChangedConfig, 'plugin-config');
    }

    if (!isEmpty(this.deliveryCategory) && this.deliveryCategory?.key) {
      this.updateConfiguration(this.deliveryCategory?.key, this.deliveryPluginChangedConfig, 'plugin-config');
    }

    if (this.apiCallsStack.length > 0) {
      forkJoin(this.apiCallsStack).subscribe((result) => {
        result.forEach((r: any) => {
          this.reenableButton.emit(false);
          if (r.failed) {
            if (r.error.status === 0) {
              console.log('service down ', r.error);
            } else {
              this.toastService.error(r.error.statusText);
            }
          } else {
            this.response.handleResponseMessage(r.type);
          }
        });
        this.apiCallsStack = [];
        this.getCategory();
        this.getNotifications();
      });
    }
    // close quickview after changing configuration (if any) and reset data
    const quickView = <HTMLDivElement>document.getElementById('quickviewDefault');
    quickView.classList.remove('is-active');
    this.rulePluginChangedConfig = {};
    this.deliveryPluginChangedConfig = {};
    this.notificationChangedConfig = {};
    this.ruleCategory = null;
    this.deliveryCategory = null;
  }

  checkFormState() {
    const noChange = !this.validConfigurationForm || isEmpty(this.changedConfig) && isEmpty(this.advancedConfiguration);
    return noChange;
  }

  checkFilterFormState() {
    const noChange = !this.validFilterConfigForm || isEmpty(this.changedFilterConfig);
    return noChange;
  }

  checkNotificationFormState() {
    return !(this.validNotificationForm && this.validDeliveryConfigForm && this.validRuleConfigForm)
      || (isEmpty(this.notificationChangedConfig) && isEmpty(this.rulePluginChangedConfig)
        && isEmpty(this.deliveryPluginChangedConfig))
  }

  getChangedConfig(changedConfiguration: any) {
    this.changedConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, this.pluginConfiguration);
  }

  getChangedAdvanceConfiguration(advanceConfig: any) {
    const configItem = this.advancedConfiguration.find(c => c.key == advanceConfig.key);
    if (configItem) {
      configItem.config = advanceConfig.config;
      if (isEmpty(configItem.config)) {
        this.advancedConfiguration = this.advancedConfiguration.filter(conf => (conf.key !== configItem.key));
      }
    } else {
      this.advancedConfiguration.push(advanceConfig)
    }
  }

  updateConfiguration(categoryName: string, configuration: any, type: string) {
    const files = this.getScriptFilesToUpload(configuration);
    if (files.length > 0) {
      this.uploadScript(categoryName, files);
    }

    if (isEmpty(configuration)) {
      this.reenableButton.emit(false);
      return;
    }
    this.apiCallsStack.push(this.configService.
      updateBulkConfiguration(categoryName, configuration)
      .pipe(map((data: any) => {
        this.reenableButton.emit(false);
        if (type == 'filter-config') {
          this.filterCategory.config = data;
          this.filterPluginConfiguration = cloneDeep(this.filterCategory);
          const { enable } = data;
          const filterConf = this.filterConfigurations.find(f => {
            if (f.filterName == this.quickviewFilterName) {
              f.enabled = enable.value
              return f;
            }
          })
          updateFilterNode(filterConf);
        }
        return { type, success: true }
      }))
      .pipe(catchError(e => of({ error: e, failed: true }))));
  }

  getScriptFilesToUpload(configuration: any) {
    return this.fileUploaderService.getConfigurationPropertyFiles(configuration);
  }

  public uploadScript(categoryName: string, files: any[]) {
    this.fileUploaderService.uploadConfigurationScript(categoryName, files);
  }

  isFilterPipelineComplex(updatedPipeline) {
    return updatedPipeline.find(p => typeof (p) !== "string");
  }

  isFilterDuplicatedInPipeline(updatedPipeline) {
    let pipeline = [...new Set(updatedPipeline)]
    return (pipeline.length !== updatedPipeline.length)
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  deleteFilterFromPipeline() {
    for (let i = 0; i < this.filterPipeline.length; i++) {
      if (typeof (this.filterPipeline[i]) === "string") {
        if (this.filterPipeline[i] === this.filterName) {
          this.filterPipeline = this.filterPipeline.filter(f => f !== this.filterName);
          this.deleteFilter();
          break;
        }
      }
      else {
        if (this.filterPipeline[i].indexOf(this.filterName) !== -1) {
          this.filterPipeline[i] = this.filterPipeline[i].filter(f => f !== this.filterName);
          if (this.filterPipeline[i].length === 0) {
            this.filterPipeline.splice(i, 1);
          }
          this.deleteFilter();
          break;
        }
      }
    }
  }

  deleteService() {
    if (this.from === 'notifications') {
      this.deleteNotification();
      return;
    }
    this.servicesApiService.deleteService(this.dialogServiceName)
      .subscribe((data: any) => {
        this.toastService.success(data['result']);
        this.router.navigate(['/flow/editor', this.from]);
      },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  deleteNotification() {
    this.ngProgress.start();
    this.notificationsService.deleteNotification(this.dialogServiceName)
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.toastService.success(data['result']);
        this.router.navigate(['/flow/editor', this.from]);
      },
        (error) => {
          this.ngProgress.done();
          this.reenableButton.emit(false);
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  getChangedFilterConfig(changedConfiguration: any) {
    this.changedFilterConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, this.filterPluginConfiguration);
  }

  onNotify() {
    this.isAddFilterWizard = false;
    this.flowEditorService.clearEmittedPipelineChanges();
    this.updatedFilterPipeline = [];
  }

  debugService() {
    this.flowEditorService.openDebuggerInQuickview.next({
      openDebuggerPage: true,
      debugger: this.service ? this.service.debug : this.task.debug,
      serviceName: this.service ? this.service.name : this.task.name
    });
  }

  reload() {
    // Save debug display nodes state before reload
    const debugDisplayNodesState = this.saveDebugDisplayNodesState();
    this.flowEditorService.saveDebugDisplayNodesStateForReload(debugDisplayNodesState);
    
    this.flowEditorService.clearEmittedPipelineChanges();
    if (editor) {
      // on reload editor clear the node history
      history?.clear();
    }
    this.filterPipeline = [];
    this.updatedFilterPipeline = [];
    this.router.navigate(['/flow/editor', this.from, this.source, 'details']);
  }

  selectAsset(event) {
    this.selectedAsset = event.assetName;
    this.openModal('asset-tracking-dialog');
  }

  deprecateAsset(assetName: string) {
    /** request started */
    this.ngProgress.start();
    this.assetService.deprecateAssetTrackEntry(this.serviceName, assetName, 'Ingest')
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          this.toastService.success(data.success);
          this.closeModal('asset-tracking-dialog');
        }, error => {
          /** request completed but error */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  getAssetReadings(service: Service) {
    const fileName = service.name + '-readings';
    const assets = service.assets;
    const assetRecord: any = [];
    if (assets.length === 0) {
      this.toastService.error('No readings to export.');
      return;
    }
    this.toastService.info('Exporting readings to ' + fileName);
    assets.forEach((ast: any) => {
      let limit = ast.count;
      let offset = 0;
      if (ast.count > this.MAX_RANGE) {
        limit = this.MAX_RANGE;
        const chunkCount = Math.ceil(ast.count / this.MAX_RANGE);
        let lastChunkLimit = (ast.count % this.MAX_RANGE);
        if (lastChunkLimit === 0) {
          lastChunkLimit = this.MAX_RANGE;
        }
        for (let j = 0; j < chunkCount; j++) {
          if (j !== 0) {
            offset = (this.MAX_RANGE * j);
          }
          if (j === (chunkCount - 1)) {
            limit = lastChunkLimit;
          }
          assetRecord.push({ asset: ast.asset, limit: limit, offset: offset });
        }
      } else {
        assetRecord.push({ asset: ast.asset, limit: limit, offset: offset });
      }
    });
    this.exportReadings(assetRecord, fileName);
  }

  exportReadings(assets: [], fileName: string) {
    let assetReadings = [];
    this.assetService.getMultiAssetsReadings(assets).
      subscribe(
        (result: any) => {
          this.reenableButton.emit(false);
          assetReadings = [].concat.apply([], result);
          this.generateCsv.download(assetReadings, fileName, 'service');
        },
        error => {
          this.reenableButton.emit(false);
          console.log('error in response', error);
        });
  }

  goToLink(urlSlug) {
    this.docService.goToServiceDocLink(urlSlug, 'fledge-service-notification');
  }

  toggleServiceState(data) {
    if (data.state) {
      this.enableSchedule(data.name);
    }
    else {
      this.disableSchedule(data.name);
    }
  }

  public toggleSchedule(name: string, enable: boolean) {
    this.ngProgress.start();
    const scheduleService = enable ? this.schedulesService.enableScheduleByName(name) : this.schedulesService.disableScheduleByName(name);
    scheduleService.subscribe(
      (data: any) => {
        this.toastService.success(data.message);
        this.ngProgress.done();
        this.closeModal('service-status-dialog');
        if (this.service) {
          this.service.schedule_enabled = enable;
        }
        if (this.task) {
          this.task.enabled = enable;
        }
        this.reenableButton.emit(false);
        updateNode(this.buildUpdateData());
      },
      (error) => {
        this.reenableButton.emit(false);
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.toastService.error(error.statusText);
        }
      }
    );
  }

  private buildUpdateData() {
    return {
      from: this.from,
      source: this.source,
      filterPipeline: this.filterPipeline,
      service: this.service ?? undefined,
      services: this.services ?? undefined,
      task: this.task ?? undefined,
      tasks: this.tasks ?? undefined,
      filterConfigurations: this.filterConfigurations,
    };
  }

  public disableSchedule(name: string) {
    this.toggleSchedule(name, false);
  }

  public enableSchedule(name: string) {
    this.toggleSchedule(name, true);
  }

  toggleState(state) {
    const payload = {
      enable: state === 'Enable' ? 'true' : 'false'
    }
    this.ngProgress.start();
    this.configService.updateBulkConfiguration(this.dialogServiceName, payload)
      .pipe(delay(1000))
      .subscribe(() => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.toastService.success(`Instance successfully ${state === 'Enable' ? 'enabled' : 'disabled'}.`);
        this.closeModal('state-change-dialog');
        this.getNotifications();
      },
        error => {
          this.ngProgress.done();
          this.reenableButton.emit(false);
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
  }

  getServiceStatus() {
    if (this.from == 'south') {
      const service: Service = this.services.find(service => service.name === this.serviceName);
      return service.schedule_enabled;
    } else if (this.from == 'north') {
      const task: NorthTask = this.tasks.find(task => task.name === this.serviceName);
      return task.enabled;
    }
  }

  async onDelete() {
    const selectedConnection = this.nodesToDelete.find(node => (node.label === 'Connection'));
    const nodesToDelete = this.nodesToDelete.filter(node => (node.label && node.label !== 'Connection'));
    if (selectedConnection) {
      await deleteConnection(selectedConnection.id);
      this.nodesToDelete = [];
      // check if filter pipeline is updated and emit the updated pipeline
      const pipeline = getUpdatedFilterPipeline();
      this.flowEditorService.emitPipelineUpdate(pipeline);
    }
    if (nodesToDelete.length > 0) {
      this.openModal('toolbar-dialog');
    }
  }

  // Delete nodes after confirmation in the dialog
  async deleteNodes() {
    const filterNodeToDelete = this.nodesToDelete.find(node => (node.label !== 'South' && node.label !== 'North' && node.label !== 'Connection'));
    if (filterNodeToDelete) {
      this.deleteFilter();
    }
    const nodeToDelete = this.nodesToDelete.find(node => (node.label === 'South' || node.label === 'North'));
    if (nodeToDelete) {
      this.dialogServiceName = nodeToDelete.name;
      this.deleteService();
    }
    this.closeModal('toolbar-dialog');
  }

  /**
     * Open Configure Service modal
     */
  openServiceConfigureModal() {
    this.serviceInfo.process = 'notification';
    this.router.navigate(['/developer/options/additional-services/config'], { state: { ...this.serviceInfo } });
  }

  async reset() {
    this.updatedFilterPipeline = [];
    
    // Save debug display nodes state before reset
    const debugDisplayNodesState = this.saveDebugDisplayNodesState();
    
    // Perform reset
    await resetNodes(this.flowEditorService);
    
    // Restore debug display nodes after reset
    if (debugDisplayNodesState.length > 0) {
      // Wait a bit for nodes to be recreated after reset
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.restoreDebugDisplayNodesState(debugDisplayNodesState);
    }
  }

  callUndoAction() {
    undoAction(this.flowEditorService);
  }

  callRedoAction() {
    redoAction(this.flowEditorService);
  }

  /**
   * Load buffer data and create debug data display nodes
   */
  async loadBufferDataAndCreateDataDisplayNodes() {
    if (!this.socket) {
      this.socket = new ClassicPreset.Socket("socket");
    }
    
    // Get the service with attached debugger
    let serviceWithDebugger: any = null;
    if (this.from === 'south') {
      serviceWithDebugger = this.services.find((s: any) => s.debug?.debugger === 'Attached');
    } else {
      serviceWithDebugger = this.tasks.find((t: any) => t.debug?.debugger === 'Attached');
    }
    
    if (!serviceWithDebugger) {
      return;
    }
    
    try {
      // Fetch buffer data
      const bufferDataResponse: any = await this.servicesApiService.getBufferedData(serviceWithDebugger.name).toPromise();
      
      // Extract the data array from the response
      // Response structure: { "data": [...] }
      this.bufferData = bufferDataResponse?.data || bufferDataResponse;
      
      console.log('Buffer data received:', this.bufferData);
      
      // Create debug data display nodes
      await this.createDebugDataDisplayNodes();
    } catch (error) {
      console.error('Failed to load buffer data:', error);
    }
  }

  /**
   * Create debug data display nodes for filter nodes and storage node
   */
  /**
   * Find a non-overlapping position for a debug data display node that minimizes distance to the target node
   * @param targetX The x position of the target node
   * @param targetY The y position of the target node
   * @param debugNodeWidth Width of the debug node (default 394)
   * @param debugNodeHeight Height of the debug node (default 250)
   * @returns A position {x, y} that doesn't overlap with existing nodes and minimizes distance
   */
  private findNonOverlappingPosition(targetX: number, targetY: number, debugNodeWidth: number = 394, debugNodeHeight: number = 250): { x: number, y: number } {
    const nodes = editor.getNodes();
    const spacing = 20; // Minimum spacing between nodes
    const offsetX = -380; // Default offset to the left
    
    // Calculate distance between two points
    const distance = (x1: number, y1: number, x2: number, y2: number): number => {
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    };
    
    // Calculate center point of a node at position (x, y) with given width and height
    const getNodeCenter = (x: number, y: number, width: number, height: number) => {
      return { x: x + width / 2, y: y + height / 2 };
    };
    
    const targetCenter = getNodeCenter(targetX, targetY, 198, 100); // Target node center (assuming default size)
    
    // Generate candidate positions with small increments, prioritizing vertical alignment
    const candidates: Array<{ x: number, y: number, distance: number }> = [];
    const verticalOffsets = [0, 10, -10, 20, -20, 30, -30, 50, -50, 80, -80, 120, -120];
    const horizontalOffsets = [0, -debugNodeWidth - spacing]; // Try same X, then further left
    
    for (const hOffset of horizontalOffsets) {
      for (const vOffset of verticalOffsets) {
        const x = targetX + offsetX + hOffset;
        const y = targetY + vOffset;
        const debugCenter = getNodeCenter(x, y, debugNodeWidth, debugNodeHeight);
        const dist = distance(targetCenter.x, targetCenter.y, debugCenter.x, debugCenter.y);
        candidates.push({ x, y, distance: dist });
      }
    }
    
    // Sort candidates by distance (closest first)
    candidates.sort((a, b) => a.distance - b.distance);
    
    // Try each candidate position in order of increasing distance
    for (const candidate of candidates) {
      let overlaps = false;
      
      for (const node of nodes) {
        const nodeView = getNodeView(node.id);
        if (!nodeView?.position) continue;
        
        const nodeX = nodeView.position.x;
        const nodeY = nodeView.position.y;
        const nodeWidth = (node as any).width || 198; // Default node width
        const nodeHeight = (node as any).height || 100; // Default node height
        
        // Check if debug node would overlap with this node
        const debugRight = candidate.x + debugNodeWidth;
        const debugBottom = candidate.y + debugNodeHeight;
        const nodeRight = nodeX + nodeWidth;
        const nodeBottom = nodeY + nodeHeight;
        
        if (!(debugRight < nodeX - spacing || 
              candidate.x > nodeRight + spacing || 
              debugBottom < nodeY - spacing || 
              candidate.y > nodeBottom + spacing)) {
          overlaps = true;
          break;
        }
      }
      
      if (!overlaps) {
        return { x: candidate.x, y: candidate.y };
      }
    }
    
    // If all positions overlap, return the closest position (first in sorted list)
    // This minimizes distance even if there's a slight overlap
    return { x: candidates[0].x, y: candidates[0].y };
  }

  async createDebugDataDisplayNodes() {
    // Remove only the main debug data display nodes (not watch nodes)
    // Watch nodes have filterNodeId or storageNodeId properties
    const nodesToRemove = this.debugDataDisplayNodes.filter((node: any) => 
      !node.filterNodeId && !node.storageNodeId
    );
    for (const debugNode of nodesToRemove) {
      try {
        // Remove connections first
        const connections = editor.getConnections();
        connections.forEach((conn: any) => {
          if (conn.target === debugNode.id || conn.source === debugNode.id) {
            editor.removeConnection(conn.id);
          }
        });
        
        // Remove node
        await editor.removeNode(debugNode.id);
      } catch (e) {
        // Node might already be removed
      }
    }
    // Update the array to only keep watch nodes
    this.debugDataDisplayNodes = this.debugDataDisplayNodes.filter((node: any) => 
      node.filterNodeId || node.storageNodeId
    );
    
    if (!this.socket) {
      this.socket = new ClassicPreset.Socket("socket");
    }
    
    const nodes = editor.getNodes();
    
    // Get all existing debug display nodes to check for watch nodes
    const existingDebugNodes = nodes.filter((node: any) => node.type === 'debug-data-display');
    
    // Find filter nodes and storage node
    const filterNodes: any[] = [];
    let storageNode: any = null;
    
    nodes.forEach((node: any) => {
      if (node.type === 'debug-data-display') {
        return; // Skip existing debug data display nodes
      }
      // Check by type instead of label, since filter labels are changed to their actual names
      if (node.type === 'filter' && !node.pseudoNode) {
        filterNodes.push(node);
      } else if (node.label === 'Storage' && this.from === 'south') {
        storageNode = node;
      }
    });
    
    // Create nodes for filters
    for (const filterNode of filterNodes) {
      // Check if this filter node already has a watch node connected to it
      // A watch node has filterNodeId matching this filter node's id
      const hasWatchNode = existingDebugNodes.some((debugNode: any) => 
        (debugNode as any).filterNodeId === filterNode.id
      );
      
      // Also check if there's already a connection to this filter node from any debug display node
      const connections = editor.getConnections();
      const hasExistingConnection = connections.some((conn: any) => {
        if (!conn || !conn.source || !conn.target) return false;
        // Check if connection is from a debug display node to this filter node
        const sourceNode = nodes.find((n: any) => n.id === conn.source);
        return sourceNode && sourceNode.type === 'debug-data-display' && conn.target === filterNode.id;
      });
      
      // Skip creating a debug display node if a watch node or connection already exists
      if (hasWatchNode || hasExistingConnection) {
        continue;
      }
      
      const nodeName = filterNode.controls?.nameControl?.['name'];
      if (!nodeName) {
        console.warn('Filter node has no name:', filterNode);
        continue;
      }
      
      // Find matching data in buffer by name
      // The buffer data structure: array that can contain objects and nested arrays
      // Each object has: { "name": "...", "readings": [...] }
      let nodeData = null;
      if (this.bufferData && Array.isArray(this.bufferData)) {
        // Recursively search through the array (which may contain nested arrays)
        const findNodeData = (arr: any[]): any => {
          for (const item of arr) {
            if (!item) continue;
            
            // If item is an object with a name property, check if it matches
            if (typeof item === 'object' && item.name === nodeName) {
              return item;
            }
            
            // If item is an array, recursively search it
            if (Array.isArray(item)) {
              const found = findNodeData(item);
              if (found) return found;
            }
          }
          return null;
        };
        
        nodeData = findNodeData(this.bufferData);
      }
      
      console.log('Filter node:', nodeName, 'Matched data:', nodeData);
      console.log('Buffer data structure:', this.bufferData);
      
      // Create debug data display node with the matched data
      // The nodeData should be the JSON object where name matches the filter node name
      // This object should contain a "readings" array
      const debugNode = new DebugDataDisplay(this.socket, nodeName, nodeData);
      await editor.addNode(debugNode);
      
      // Ensure debugData is set correctly
      debugNode.debugData = nodeData;
      
      // Position node to the left of the filter node
      const filterNodeView = getNodeView(filterNode.id);
      if (filterNodeView?.position) {
        const debugNodeView = getNodeView(debugNode.id);
        if (debugNodeView) {
          const position = this.findNonOverlappingPosition(
            filterNodeView.position.x, 
            filterNodeView.position.y,
            debugNode.width || 394,
            debugNode.height || 250
          );
          await debugNodeView.translate(position.x, position.y);
        }
      }
      
      // Wait for nodes to be fully rendered before creating connection
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Connect debug node to filter node (from debug node output to filter node input)
      try {
        // Check that both nodes have the required ports
        const sourceView = getNodeView(debugNode.id);
        const targetView = getNodeView(filterNode.id);
        
        if (sourceView?.position && targetView?.position) {
          // Check for existing connections to avoid duplicates
          const existingConnections = editor.getConnections().filter(conn => {
            if (!conn || !conn.source || !conn.target) return false;
            return (conn.source === filterNode.id && conn.target === debugNode.id) ||
                   (conn.source === debugNode.id && conn.target === filterNode.id);
          });
          
          if (existingConnections.length === 0) {
            const connection = new Connection(connectionEvents, debugNode as any, filterNode as any);
            await editor.addConnection(connection);
            await area.update('connection', connection.id);
            await area.update('node', debugNode.id);
            await area.update('node', filterNode.id);
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      } catch (e) {
        console.warn('Failed to create connection from debug node to filter node:', e);
      }
      
      this.debugDataDisplayNodes.push(debugNode);
    }
    
    // Create node for storage
    if (storageNode) {
      // Check if the storage node already has a watch node connected to it
      // A watch node has storageNodeId matching this storage node's id
      const hasWatchNode = existingDebugNodes.some((debugNode: any) => 
        (debugNode as any).storageNodeId === storageNode.id
      );
      
      // Also check if there's already a connection to this storage node from any debug display node
      const connections = editor.getConnections();
      const hasExistingConnection = connections.some((conn: any) => {
        if (!conn || !conn.source || !conn.target) return false;
        // Check if connection is from a debug display node to this storage node
        const sourceNode = nodes.find((n: any) => n.id === conn.source);
        return sourceNode && sourceNode.type === 'debug-data-display' && conn.target === storageNode.id;
      });
      
      // Skip creating a debug display node if a watch node or connection already exists
      if (hasWatchNode || hasExistingConnection) {
        return;
      }
      
      // Find all Writer data in buffer (recursively search through nested arrays)
      // Multiple branches can feed into storage, so there may be multiple Writer nodes
      let writerData = null;
      if (this.bufferData && Array.isArray(this.bufferData)) {
        const findAllWriterData = (arr: any[]): any[] => {
          const writers: any[] = [];
          for (const item of arr) {
            if (!item) continue;
            
            // If item is an object with a name property matching "Writer"
            if (typeof item === 'object' && item.name && item.name.toLowerCase().includes('writer')) {
              writers.push(item);
            }
            
            // If item is an array, recursively search it
            if (Array.isArray(item)) {
              const found = findAllWriterData(item);
              writers.push(...found);
            }
          }
          return writers;
        };
        
        const allWriters = findAllWriterData(this.bufferData);
        
        // Combine all Writer nodes' readings into a single data structure
        if (allWriters.length > 0) {
          // Combine readings from all Writer nodes
          const combinedReadings: any[] = [];
          allWriters.forEach((writer: any) => {
            if (writer.readings && Array.isArray(writer.readings)) {
              combinedReadings.push(...writer.readings);
            }
          });
          
          // Create a combined data structure with all readings
          writerData = {
            name: 'Storage',
            readings: combinedReadings
          };
        }
      }
      
      console.log('Storage node - Matched Writer data:', writerData);
      
      const debugNode = new DebugDataDisplay(this.socket, 'Storage', writerData);
      await editor.addNode(debugNode);
      
      // Ensure debugData is set correctly
      debugNode.debugData = writerData;
      
      // Position node to avoid overlaps with other nodes
      const storageNodeView = getNodeView(storageNode.id);
      if (storageNodeView?.position) {
        const debugNodeView = getNodeView(debugNode.id);
        if (debugNodeView) {
          const position = this.findNonOverlappingPosition(
            storageNodeView.position.x, 
            storageNodeView.position.y,
            debugNode.width || 394,
            debugNode.height || 250
          );
          await debugNodeView.translate(position.x, position.y);
        }
      }
      
      // Wait for nodes to be fully rendered before creating connection
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Connect debug node to storage node (from debug node output to storage node input)
      try {
        // Check that both nodes have the required ports
        const sourceView = getNodeView(debugNode.id);
        const targetView = getNodeView(storageNode.id);
        
        if (sourceView?.position && targetView?.position) {
          // Check for existing connections to avoid duplicates
          const existingConnections = editor.getConnections().filter(conn => {
            if (!conn || !conn.source || !conn.target) return false;
            return (conn.source === storageNode.id && conn.target === debugNode.id) ||
                   (conn.source === debugNode.id && conn.target === storageNode.id);
          });
          
          if (existingConnections.length === 0) {
            const connection = new Connection(connectionEvents, debugNode as any, storageNode as any);
            await editor.addConnection(connection);
            await area.update('connection', connection.id);
            await area.update('node', debugNode.id);
            await area.update('node', storageNode.id);
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      } catch (e) {
        console.warn('Failed to create connection from debug node to storage node:', e);
      }
      
      this.debugDataDisplayNodes.push(debugNode);
    }
    
    this.cdRf.detectChanges();
  }

  /**
   * Remove all debug data display nodes and their connections
   */
  async removeDebugDataDisplayNodes() {
    for (const debugNode of this.debugDataDisplayNodes) {
      try {
        // Remove connections first
        const connections = editor.getConnections();
        connections.forEach((conn: any) => {
          if (conn.target === debugNode.id || conn.source === debugNode.id) {
            editor.removeConnection(conn.id);
          }
        });
        
        // Remove node
        await editor.removeNode(debugNode.id);
      } catch (e) {
        // Node might already be removed
      }
    }
    this.debugDataDisplayNodes = [];
  }

  /**
   * Check if ingress is not suspended for the service/task with attached debugger
   */
  private isIngressNotSuspended(): boolean {
    let serviceWithDebugger: any = null;
    if (this.from === 'south') {
      serviceWithDebugger = this.services.find((s: any) => s.debug?.debugger === 'Attached');
    } else if (this.from === 'north') {
      serviceWithDebugger = this.tasks.find((t: any) => t.debug?.debugger === 'Attached');
    }
    
    if (!serviceWithDebugger) {
      return false;
    }
    
    // Check if ingress is not suspended (i.e., it's 'Running')
    return serviceWithDebugger.debug?.ingress !== 'Suspended';
  }

  /**
   * Update existing debug display nodes with new buffer data
   */
  async refreshDebugDisplayNodes() {
    // Allow manual refresh even if ingress is suspended (user explicitly clicked refresh)
    // The isIngressNotSuspended check is only for auto-refresh polling

    // Get the service with attached debugger
    let serviceWithDebugger: any = null;
    if (this.from === 'south') {
      serviceWithDebugger = this.services.find((s: any) => s.debug?.debugger === 'Attached');
    } else {
      serviceWithDebugger = this.tasks.find((t: any) => t.debug?.debugger === 'Attached');
    }
    
    if (!serviceWithDebugger) {
      return;
    }
    
    try {
      // Fetch latest buffer data
      const bufferDataResponse: any = await this.servicesApiService.getBufferedData(serviceWithDebugger.name).toPromise();
      this.bufferData = bufferDataResponse?.data || bufferDataResponse;
      
      // Update existing debug display nodes with new data
      const nodes = editor.getNodes();
      for (const debugNode of this.debugDataDisplayNodes) {
        const nodeInEditor = nodes.find((n: any) => n.id === debugNode.id);
        if (!nodeInEditor) continue;
        
        // Get node name - could be from nodeName property, filterNodeName for filter watch nodes, or storageNodeId for storage watch nodes
        const nodeName = debugNode.nodeName || (debugNode as any).filterNodeName;
        const isStorageWatchNode = !!(debugNode as any).storageNodeId;
        let nodeData = null;
        
        // For storage watch nodes, look for all Writer data and combine
        if (isStorageWatchNode || nodeName === 'Storage') {
          const findAllWriterData = (arr: any[]): any[] => {
            const writers: any[] = [];
            for (const item of arr) {
              if (!item) continue;
              if (typeof item === 'object' && item.name && item.name.toLowerCase().includes('writer')) {
                writers.push(item);
              }
              if (Array.isArray(item)) {
                const found = findAllWriterData(item);
                writers.push(...found);
              }
            }
            return writers;
          };
          
          const allWriters = findAllWriterData(this.bufferData);
          
          // Combine all Writer nodes' readings into a single data structure
          if (allWriters.length > 0) {
            const combinedReadings: any[] = [];
            allWriters.forEach((writer: any) => {
              if (writer.readings && Array.isArray(writer.readings)) {
                combinedReadings.push(...writer.readings);
              }
            });
            
            nodeData = {
              name: 'Storage',
              readings: combinedReadings
            };
          }
        } else {
          // For filter nodes, find matching data in buffer by name
          if (this.bufferData && Array.isArray(this.bufferData)) {
            const findNodeData = (arr: any[]): any => {
              for (const item of arr) {
                if (!item) continue;
                if (typeof item === 'object' && item.name === nodeName) {
                  return item;
                }
                if (Array.isArray(item)) {
                  const found = findNodeData(item);
                  if (found) return found;
                }
              }
              return null;
            };
            
            nodeData = findNodeData(this.bufferData);
          }
        }
        
        // Update the debug node with new data
        if (nodeInEditor instanceof DebugDataDisplay) {
          // Create a new object reference to trigger Angular change detection
          nodeInEditor.debugData = nodeData ? JSON.parse(JSON.stringify(nodeData)) : nodeData;
          // Update the control to reflect new data
          const control = nodeInEditor.controls?.debugDataDisplayControl as any;
          if (control) {
            control.debugData = nodeData ? JSON.parse(JSON.stringify(nodeData)) : nodeData;
          }
          // Trigger update
          await area.update('node', nodeInEditor.id);
        }
      }
      
      this.cdRf.detectChanges();
    } catch (error) {
      console.error('Failed to refresh debug display nodes:', error);
    }
  }

  /**
   * Start auto-refresh for debug display nodes
   */
  private startDebugDisplayAutoRefresh() {
    // Stop any existing refresh subscription
    this.stopDebugDisplayAutoRefresh();
    
    // Start polling every 5 seconds
    this.debugDisplayRefreshSubscription = interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Check if there are any debug display nodes to refresh
        const areDebugDisplayNodesVisible = this.flowEditorService.showDebuggerDataDisplay.value;
        const hasFilterWatchNodes = this.debugDataDisplayNodes.some((node: any) => 
          (node as any).filterNodeId !== undefined
        );
        const hasStorageWatchNodes = this.debugDataDisplayNodes.some((node: any) => 
          (node as any).storageNodeId !== undefined
        );
        const hasNodesToRefresh = areDebugDisplayNodesVisible || hasFilterWatchNodes || hasStorageWatchNodes;
        
        // Only refresh if there are nodes to refresh and ingress is not suspended
        if (hasNodesToRefresh && this.isIngressNotSuspended()) {
          this.refreshDebugDisplayNodes();
        } else if (!hasNodesToRefresh) {
          // Stop refreshing if there are no nodes to refresh
          this.stopDebugDisplayAutoRefresh();
        }
      });
  }

  /**
   * Stop auto-refresh for debug display nodes
   */
  private stopDebugDisplayAutoRefresh() {
    if (this.debugDisplayRefreshSubscription) {
      this.debugDisplayRefreshSubscription.unsubscribe();
      this.debugDisplayRefreshSubscription = null;
    }
  }

  /**
   * Create a debug display node for a watched filter node
   */
  async createFilterWatchNode(filterNodeId: string, filterNodeName: string, filterNode: any) {
    if (!this.socket) {
      this.socket = new ClassicPreset.Socket("socket");
    }

    // Check if watch node already exists for this filter
    const nodes = editor.getNodes();
    const existingWatchNode = nodes.find((n: any) => 
      n.type === 'debug-data-display' && (n as any).filterNodeId === filterNodeId
    );
    if (existingWatchNode) {
      // Already watching, but this shouldn't happen if toggle is working correctly
      // Update the watch state in the array if needed
      const existingInArray = this.debugDataDisplayNodes.find((node: any) => 
        (node as any).filterNodeId === filterNodeId
      );
      if (!existingInArray && existingWatchNode) {
        this.debugDataDisplayNodes.push(existingWatchNode);
      }
      return; // Already watching
    }

    // Get the service with attached debugger to fetch buffer data
    let serviceWithDebugger: any = null;
    if (this.from === 'south') {
      serviceWithDebugger = this.services.find((s: any) => s.debug?.debugger === 'Attached');
    } else {
      serviceWithDebugger = this.tasks.find((t: any) => t.debug?.debugger === 'Attached');
    }
    
    if (!serviceWithDebugger) {
      return;
    }

    try {
      // Fetch buffer data
      const bufferDataResponse: any = await this.servicesApiService.getBufferedData(serviceWithDebugger.name).toPromise();
      this.bufferData = bufferDataResponse?.data || bufferDataResponse;
      
      // Find matching data in buffer for this filter
      let nodeData = null;
      if (this.bufferData && Array.isArray(this.bufferData)) {
        const findNodeData = (arr: any[]): any => {
          for (const item of arr) {
            if (!item) continue;
            if (typeof item === 'object' && item.name === filterNodeName) {
              return item;
            }
            if (Array.isArray(item)) {
              const found = findNodeData(item);
              if (found) return found;
            }
          }
          return null;
        };
        nodeData = findNodeData(this.bufferData);
      }

      // Create debug display node
      const debugNode = new DebugDataDisplay(this.socket, filterNodeName, nodeData);
      debugNode.debugData = nodeData;
      // Store reference to the filter node
      (debugNode as any).filterNodeId = filterNodeId;
      
      await editor.addNode(debugNode);
      
      // Position node to avoid overlaps with other nodes
      const filterNodeView = getNodeView(filterNodeId);
      if (filterNodeView?.position) {
        const debugNodeView = getNodeView(debugNode.id);
        if (debugNodeView) {
          const position = this.findNonOverlappingPosition(
            filterNodeView.position.x, 
            filterNodeView.position.y,
            debugNode.width || 394,
            debugNode.height || 250
          );
          await debugNodeView.translate(position.x, position.y);
        }
      }
      
      // Wait for nodes to be fully rendered before creating connection
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Connect debug node to filter node (from debug node output to filter node input)
      try {
        const sourceView = getNodeView(debugNode.id);
        const targetView = getNodeView(filterNodeId);
        
        if (sourceView?.position && targetView?.position) {
          // Check for existing connections to avoid duplicates
          const existingConnections = editor.getConnections().filter(conn => {
            if (!conn || !conn.source || !conn.target) return false;
            return (conn.source === filterNodeId && conn.target === debugNode.id) ||
                   (conn.source === debugNode.id && conn.target === filterNodeId);
          });
          
          if (existingConnections.length === 0) {
            const connection = new Connection(connectionEvents, debugNode as any, filterNode as any);
            await editor.addConnection(connection);
            await area.update('connection', connection.id);
            await area.update('node', debugNode.id);
            await area.update('node', filterNodeId);
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      } catch (e) {
        console.warn('Failed to create connection from debug node to filter node:', e);
      }
      
      this.debugDataDisplayNodes.push(debugNode);
      
      // Start auto-refresh if not already running (for filter watch nodes)
      if (!this.debugDisplayRefreshSubscription && this.isIngressNotSuspended()) {
        this.startDebugDisplayAutoRefresh();
      }
      
      // Notify custom-node component that watch state has changed
      this.flowEditorService.filterWatchStateChanged.next({
        filterNodeId: filterNodeId,
        isWatched: true
      });
      
      this.cdRf.detectChanges();
    } catch (error) {
      console.error('Failed to create filter watch node:', error);
    }
  }

  /**
   * Remove debug display node for a watched filter node
   */
  async removeFilterWatchNode(filterNodeId: string) {
    // Check both the array and the editor nodes to find the watch node
    let watchNode = this.debugDataDisplayNodes.find((node: any) => 
      (node as any).filterNodeId === filterNodeId
    );
    
    // If not found in array, check editor nodes
    if (!watchNode) {
      const nodes = editor.getNodes();
      watchNode = nodes.find((n: any) => 
        n.type === 'debug-data-display' && (n as any).filterNodeId === filterNodeId
      );
    }
    
    if (!watchNode) {
      return;
    }

    try {
      // Remove connections first
      const connections = editor.getConnections();
      connections.forEach((conn: any) => {
        if (conn.target === watchNode.id || conn.source === watchNode.id) {
          editor.removeConnection(conn.id);
        }
      });
      
      // Remove node
      await editor.removeNode(watchNode.id);
      
      // Remove from array
      const index = this.debugDataDisplayNodes.indexOf(watchNode);
      if (index > -1) {
        this.debugDataDisplayNodes.splice(index, 1);
      }
      
      // Stop auto-refresh if no debug display nodes remain (unless main debug display is visible)
      const areDebugDisplayNodesVisible = this.flowEditorService.showDebuggerDataDisplay.value;
      const hasAnyDebugNodes = this.debugDataDisplayNodes.length > 0;
      if (!areDebugDisplayNodesVisible && !hasAnyDebugNodes && this.debugDisplayRefreshSubscription) {
        this.stopDebugDisplayAutoRefresh();
      }
      
      // Notify custom-node component that watch state has changed
      this.flowEditorService.filterWatchStateChanged.next({
        filterNodeId: filterNodeId,
        isWatched: false
      });
      
      this.cdRf.detectChanges();
    } catch (e) {
      console.warn('Failed to remove filter watch node:', e);
    }
  }

  /**
   * Create a debug display node for a watched storage node
   */
  async createStorageWatchNode(storageNodeId: string, storageNode: any) {
    if (!this.socket) {
      this.socket = new ClassicPreset.Socket("socket");
    }

    // Check if watch node already exists for this storage
    const nodes = editor.getNodes();
    const existingWatchNode = nodes.find((n: any) => 
      n.type === 'debug-data-display' && (n as any).storageNodeId === storageNodeId
    );
    if (existingWatchNode) {
      // Already watching, but this shouldn't happen if toggle is working correctly
      const existingInArray = this.debugDataDisplayNodes.find((node: any) => 
        (node as any).storageNodeId === storageNodeId
      );
      if (!existingInArray && existingWatchNode) {
        this.debugDataDisplayNodes.push(existingWatchNode);
      }
      return; // Already watching
    }

    // Get the service with attached debugger to fetch buffer data
    let serviceWithDebugger: any = null;
    if (this.from === 'south') {
      serviceWithDebugger = this.services.find((s: any) => s.debug?.debugger === 'Attached');
    } else {
      serviceWithDebugger = this.tasks.find((t: any) => t.debug?.debugger === 'Attached');
    }
    
    if (!serviceWithDebugger) {
      return;
    }

    try {
      // Fetch buffer data
      const bufferDataResponse: any = await this.servicesApiService.getBufferedData(serviceWithDebugger.name).toPromise();
      this.bufferData = bufferDataResponse?.data || bufferDataResponse;
      
      // Find all Writer data in buffer for storage node and combine
      let nodeData = null;
      if (this.bufferData && Array.isArray(this.bufferData)) {
        const findAllWriterData = (arr: any[]): any[] => {
          const writers: any[] = [];
          for (const item of arr) {
            if (!item) continue;
            if (typeof item === 'object' && item.name && item.name.toLowerCase().includes('writer')) {
              writers.push(item);
            }
            if (Array.isArray(item)) {
              const found = findAllWriterData(item);
              writers.push(...found);
            }
          }
          return writers;
        };
        
        const allWriters = findAllWriterData(this.bufferData);
        
        // Combine all Writer nodes' readings into a single data structure
        if (allWriters.length > 0) {
          const combinedReadings: any[] = [];
          allWriters.forEach((writer: any) => {
            if (writer.readings && Array.isArray(writer.readings)) {
              combinedReadings.push(...writer.readings);
            }
          });
          
          nodeData = {
            name: 'Storage',
            readings: combinedReadings
          };
        }
      }

      // Create debug display node
      const debugNode = new DebugDataDisplay(this.socket, 'Storage', nodeData);
      debugNode.debugData = nodeData;
      // Store reference to the storage node
      (debugNode as any).storageNodeId = storageNodeId;
      
      await editor.addNode(debugNode);
      
      // Position node to avoid overlaps with other nodes
      const storageNodeView = getNodeView(storageNodeId);
      if (storageNodeView?.position) {
        const debugNodeView = getNodeView(debugNode.id);
        if (debugNodeView) {
          const position = this.findNonOverlappingPosition(
            storageNodeView.position.x, 
            storageNodeView.position.y,
            debugNode.width || 394,
            debugNode.height || 250
          );
          await debugNodeView.translate(position.x, position.y);
        }
      }
      
      // Wait for nodes to be fully rendered before creating connection
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Connect debug node to storage node (from debug node output to storage node input)
      try {
        const sourceView = getNodeView(debugNode.id);
        const targetView = getNodeView(storageNodeId);
        
        if (sourceView?.position && targetView?.position) {
          // Check for existing connections to avoid duplicates
          const existingConnections = editor.getConnections().filter(conn => {
            if (!conn || !conn.source || !conn.target) return false;
            return (conn.source === storageNodeId && conn.target === debugNode.id) ||
                   (conn.source === debugNode.id && conn.target === storageNodeId);
          });
          
          if (existingConnections.length === 0) {
            const connection = new Connection(connectionEvents, debugNode as any, storageNode as any);
            await editor.addConnection(connection);
            await area.update('connection', connection.id);
            await area.update('node', debugNode.id);
            await area.update('node', storageNodeId);
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      } catch (e) {
        console.warn('Failed to create connection from debug node to storage node:', e);
      }
      
      this.debugDataDisplayNodes.push(debugNode);
      
      // Start auto-refresh if not already running (for storage watch nodes)
      if (!this.debugDisplayRefreshSubscription && this.isIngressNotSuspended()) {
        this.startDebugDisplayAutoRefresh();
      }
      
      // Notify custom-node component that watch state has changed
      this.flowEditorService.storageWatchStateChanged.next({
        storageNodeId: storageNodeId,
        isWatched: true
      });
      
      this.cdRf.detectChanges();
    } catch (error) {
      console.error('Failed to create storage watch node:', error);
    }
  }

  /**
   * Remove debug display node for a watched storage node
   */
  async removeStorageWatchNode(storageNodeId: string) {
    // Check both the array and the editor nodes to find the watch node
    let watchNode = this.debugDataDisplayNodes.find((node: any) => 
      (node as any).storageNodeId === storageNodeId
    );
    
    // If not found in array, check editor nodes
    if (!watchNode) {
      const nodes = editor.getNodes();
      watchNode = nodes.find((n: any) => 
        n.type === 'debug-data-display' && (n as any).storageNodeId === storageNodeId
      );
    }
    
    if (!watchNode) {
      return;
    }

    try {
      // Remove connections first
      const connections = editor.getConnections();
      connections.forEach((conn: any) => {
        if (conn.target === watchNode.id || conn.source === watchNode.id) {
          editor.removeConnection(conn.id);
        }
      });
      
      // Remove node
      await editor.removeNode(watchNode.id);
      
      // Remove from array
      const index = this.debugDataDisplayNodes.indexOf(watchNode);
      if (index > -1) {
        this.debugDataDisplayNodes.splice(index, 1);
      }
      
      // Stop auto-refresh if no debug display nodes remain (unless main debug display is visible)
      const areDebugDisplayNodesVisible = this.flowEditorService.showDebuggerDataDisplay.value;
      const hasAnyDebugNodes = this.debugDataDisplayNodes.length > 0;
      if (!areDebugDisplayNodesVisible && !hasAnyDebugNodes && this.debugDisplayRefreshSubscription) {
        this.stopDebugDisplayAutoRefresh();
      }
      
      // Notify custom-node component that watch state has changed
      this.flowEditorService.storageWatchStateChanged.next({
        storageNodeId: storageNodeId,
        isWatched: false
      });
      
      this.cdRf.detectChanges();
    } catch (e) {
      console.warn('Failed to remove storage watch node:', e);
    }
  }

  /**
   * Save the state of all debug display nodes before reset
   */
  private saveDebugDisplayNodesState(): any[] {
    const state: any[] = [];
    
    for (const debugNode of this.debugDataDisplayNodes) {
      // Get node position
      const nodeView = getNodeView(debugNode.id);
      const position = nodeView?.position || { x: 0, y: 0 };
      
      // Get target node info (filter or storage node it's connected to)
      const connections = editor.getConnections();
      const connection = connections.find((conn: any) => 
        conn.source === debugNode.id || conn.target === debugNode.id
      );
      
      let targetNodeInfo: any = null;
      if (connection) {
        const targetNodeId = connection.source === debugNode.id ? connection.target : connection.source;
        const nodes = editor.getNodes();
        const targetNode = nodes.find((n: any) => n.id === targetNodeId);
        if (targetNode) {
          // For filter nodes, save the filter name
          if ((targetNode as any).type === 'filter' && !(targetNode as any).pseudoNode) {
            const filterName = (targetNode as any).controls?.nameControl?.['name'];
            targetNodeInfo = {
              type: 'filter',
              name: filterName
            };
          } else if ((targetNode as any).label === 'Storage') {
            targetNodeInfo = {
              type: 'storage'
            };
          }
        }
      }
      
      // Save state
      state.push({
        nodeName: debugNode.nodeName || (debugNode as any).filterNodeName || 'Storage',
        debugData: debugNode.debugData,
        position: { x: position.x, y: position.y },
        targetNodeInfo: targetNodeInfo,
        filterNodeId: (debugNode as any).filterNodeId, // For watch nodes
        storageNodeId: (debugNode as any).storageNodeId, // For watch nodes
        isWatchNode: !!(debugNode as any).filterNodeId || !!(debugNode as any).storageNodeId
      });
    }
    
    return state;
  }

  /**
   * Restore debug display nodes state after reload
   */
  private async restoreDebugDisplayNodesStateAfterReload(): Promise<void> {
    const savedState = this.flowEditorService.getSavedDebugDisplayNodesStateForReload();
    if (savedState && savedState.length > 0) {
      // Wait a bit for editor to be fully initialized and nodes to be rendered
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if editor is available
      if (!editor || !editor.getNodes) {
        // If editor not ready, try again after a delay
        setTimeout(() => this.restoreDebugDisplayNodesStateAfterReload(), 500);
        return;
      }
      
      await this.restoreDebugDisplayNodesState(savedState);
      // Clear the saved state after restoration
      this.flowEditorService.clearSavedDebugDisplayNodesStateForReload();
    }
  }

  /**
   * Restore debug display nodes after reset
   */
  private async restoreDebugDisplayNodesState(savedState: any[]): Promise<void> {
    if (!this.socket) {
      this.socket = new ClassicPreset.Socket("socket");
    }
    
    // Clear existing debug display nodes array (they were removed by reset)
    this.debugDataDisplayNodes = [];
    
    for (const state of savedState) {
      // Find the target node after reset
      let targetNode: any = null;
      const nodes = editor.getNodes();
      
      if (state.targetNodeInfo?.type === 'filter') {
        // Find filter node by name
        targetNode = nodes.find((n: any) => 
          n.type === 'filter' && 
          !n.pseudoNode && 
          n.controls?.nameControl?.['name'] === state.targetNodeInfo.name
        );
      } else if (state.targetNodeInfo?.type === 'storage') {
        // Find storage node
        targetNode = nodes.find((n: any) => n.label === 'Storage' && this.from === 'south');
      }
      
      if (!targetNode) {
        // Target node not found, skip this debug display node
        continue;
      }
      
      // Create debug display node
      const debugNode = new DebugDataDisplay(this.socket, state.nodeName, state.debugData);
      debugNode.debugData = state.debugData;
      
      // Restore watch node metadata if it was a watch node
      if (state.isWatchNode) {
        if (state.filterNodeId) {
          (debugNode as any).filterNodeId = targetNode.id;
        } else if (state.storageNodeId) {
          (debugNode as any).storageNodeId = targetNode.id;
        }
      }
      
      await editor.addNode(debugNode);
      
      // Restore position
      const debugNodeView = getNodeView(debugNode.id);
      if (debugNodeView && state.position) {
        await debugNodeView.translate(state.position.x, state.position.y);
      }
      
      // Wait for node to be rendered
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Restore connection
      try {
        const sourceView = getNodeView(debugNode.id);
        const targetView = getNodeView(targetNode.id);
        
        if (sourceView?.position && targetView?.position) {
          // Check for existing connections to avoid duplicates
          const existingConnections = editor.getConnections().filter((conn: any) => {
            if (!conn || !conn.source || !conn.target) return false;
            return (conn.source === targetNode.id && conn.target === debugNode.id) ||
                   (conn.source === debugNode.id && conn.target === targetNode.id);
          });
          
          if (existingConnections.length === 0) {
            const connection = new Connection(connectionEvents, debugNode as any, targetNode as any);
            await editor.addConnection(connection);
            await area.update('connection', connection.id);
            await area.update('node', debugNode.id);
            await area.update('node', targetNode.id);
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      } catch (e) {
        console.warn('Failed to restore connection for debug display node:', e);
      }
      
      this.debugDataDisplayNodes.push(debugNode);
      
      // Notify watch state if it was a watch node
      if (state.isWatchNode) {
        if (state.filterNodeId) {
          this.flowEditorService.filterWatchStateChanged.next({
            filterNodeId: targetNode.id,
            isWatched: true
          });
        } else if (state.storageNodeId) {
          this.flowEditorService.storageWatchStateChanged.next({
            storageNodeId: targetNode.id,
            isWatched: true
          });
        }
      }
    }
    
    // Restart auto-refresh if needed
    const areDebugDisplayNodesVisible = this.flowEditorService.showDebuggerDataDisplay.value;
    const hasAnyDebugNodes = this.debugDataDisplayNodes.length > 0;
    if ((areDebugDisplayNodesVisible || hasAnyDebugNodes) && this.isIngressNotSuspended()) {
      this.startDebugDisplayAutoRefresh();
    }
    
    this.cdRf.detectChanges();
  }

  ngOnDestroy() {
    this.isAlive = false;
    this.debuggerStateSubscription?.unsubscribe();
    this.pipelineSubscription?.unsubscribe();
    this.subscription?.unsubscribe();
    this.filterSubscription?.unsubscribe();
    this.connectionSubscription?.unsubscribe();
    this.serviceSubscription?.unsubscribe();
    this.removeFilterSubscription?.unsubscribe();
    this.exportReadingSubscription?.unsubscribe();
    this.logsSubscription?.unsubscribe();
    this.nodeClickSubscription?.unsubscribe();
    this.nodeDropdownClickSubscription?.unsubscribe();
    this.serviceStatusSubscription?.unsubscribe();
    this.stopDebugDisplayAutoRefresh();
    if (this.from === 'notifications') {
      this.serviceDetailsSubscription?.unsubscribe();
      this.paramsSubscription?.unsubscribe();
    }
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}


