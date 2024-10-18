import { Component, ElementRef, EventEmitter, HostListener, Injector, OnInit, ViewChild } from '@angular/core';
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
  ServicesApiService,
  SharedService,
  ToastService
} from './../../../services';
import { createEditor, deleteConnection, getUpdatedFilterPipeline, removeNode, updateFilterNode, updateNode, applyContentReordering, undoAction, redoAction, resetNodes } from './editor';
import { FlowEditorService } from './flow-editor.service';

@Component({
  selector: 'app-node-editor',
  templateUrl: './node-editor.component.html',
  styleUrls: ['./node-editor.component.css']
})
export class NodeEditorComponent implements OnInit {
  @ViewChild(ServiceWarningComponent, { static: true }) notificationServiceWarningComponent: ServiceWarningComponent;
  @ViewChild(ServiceConfigComponent, { static: true }) notificationServiceConfigComponent: ServiceConfigComponent;
  @ViewChild("rete") container!: ElementRef;

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
  private removeFilterSubscription: Subscription;
  private exportReadingSubscription: Subscription;
  private serviceDetailsSubscription: Subscription;
  private logsSubscription: Subscription;
  private paramsSubscription: Subscription;
  private nodeClickSubscription: Subscription;

  showPluginConfiguration: boolean = false;
  showFilterConfiguration: boolean = false;
  showLogs: boolean = false;
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
  isNodeSelect = false;
  nodesToDelete = [];

  constructor(public injector: Injector,
    private route: ActivatedRoute,
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
        history.replaceState({ shouldSkipCalls: false }, '');

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

  @HostListener('document:keydown', ['$event'])
  onKeydownHandler(event) {
    if ((event.ctrlKey || event.metaKey) && event.keyCode == 90) {
      undoAction();
    }
    if ((event.ctrlKey || event.metaKey) && event.keyCode == 89) {
      redoAction();
    }
    if (event.keyCode == 32) {
      resetNodes();
    }
    if (event.key === 'Delete') {
      this.deleteSelected();
    }
  }

  ngOnInit(): void {
    this.logsSubscription = this.flowEditorService.showLogsInQuickview.subscribe(data => {
      this.showLogs = data.showLogs ? true : false;
      this.notification = data?.notification;
      this.serviceName = data?.serviceName ? data.serviceName : this.notification?.name;
      this.showNotificationConfiguration = false;
      this.showPluginConfiguration = false;
      this.showFilterConfiguration = false;
      this.showTaskSchedule = false;
      this.showReadings = false;
    });
    this.subscription = this.flowEditorService.showItemsInQuickview.pipe(skip(1)).subscribe(data => {
      if (this.from === 'notifications') {
        this.showLogs = false;
        this.showNotificationConfiguration = data.showNotificationConfiguration ? true : false;
        this.notification = data?.notification;
        this.serviceName = data.notification.name;
        if (this.showNotificationConfiguration) {
          this.getCategory();
          this.getRuleConfiguration();
          this.getDeliveryConfiguration();
        }
        return;
      }
      this.showPluginConfiguration = data.showPluginConfiguration ? true : false;
      this.showFilterConfiguration = data.showFilterConfiguration ? true : false;
      this.showTaskSchedule = data.showTaskSchedule ? true : false;
      this.showReadings = data.showReadings ? true : false;
      this.serviceName = data?.serviceName;
      this.showLogs = false;

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
          if (updatedPipeline && updatedPipeline.length > 0) {
            this.updatedFilterPipeline = updatedPipeline;
            console.log(this.updatedFilterPipeline);
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

    this.exportReadingSubscription = this.flowEditorService.exportReading.pipe(skip(1)).subscribe(data => {
      let service = this.services.find(service => (service.name == data.serviceName));
      this.getAssetReadings(service);
    });

    this.nodeClickSubscription = this.flowEditorService.nodeClick.pipe(skip(1)).subscribe(data => {
      if (data.label !== 'Storage' && data.label !== 'Filter') {
        this.isNodeSelect = data.selected;
        if (this.isNodeSelect && !this.nodesToDelete?.some(node => (node.id == data.id)) && data.label !== 'Storage') {
          this.nodesToDelete.push({ id: data.id, 'label': data.label, 'name': data.controls.nameControl['name'] });
        }
        else if (!this.isNodeSelect && data.label !== 'Storage') {
          const nodesToDelete = this.nodesToDelete.filter(node => node.id !== data.id);
          this.nodesToDelete = nodesToDelete;
        }
        this.moveNodeToFront(data.id);
      }
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
  }

  ngAfterViewInit(): void {
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
                this.filterConfigApiCallsStack = [];
              });
            }
            else {
              if (this.from !== 'notifications') {
                createEditor(el, this.injector, this.flowEditorService, this.rolesService, this.alertService, data);
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
        this.task = tasks.find(t => (t.name == this.source));

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
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.toastService.error(error.statusText);
          }
        });
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
    this.filterService.updateFilterPipeline({ 'pipeline': this.filterPipeline }, this.source)
      .subscribe(() => {
        this.filterService.deleteFilter(this.filterName).subscribe((data: any) => {
          this.toastService.success(data.result);
          setTimeout(() => {
            this.router.navigate(['/flow/editor', this.from, this.source, 'details']);
          }, 1000);
        },
          (error) => {
            this.reenableButton.emit(false);
            if (error.status === 0) {
              console.log('service down ', error);
            } else {
              this.toastService.error(error.statusText);
            }
          });
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
    let updatedPipeline = getUpdatedFilterPipeline();
    if (updatedPipeline && updatedPipeline.length > 0) {
      this.updatedFilterPipeline = updatedPipeline;
      if (this.isPipelineUpdated() && this.isEachFilterConfigured()) {
        this.updateFilterPipeline();
        console.log(this.updatedFilterPipeline);
      }
    }
  }

  updateFilterPipeline() {
    this.filterService.updateFilterPipeline({ 'pipeline': this.updatedFilterPipeline }, this.source)
      .subscribe((data: any) => {
        this.toastService.success(data.result);
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

  isPipelineUpdated() {
    if (this.filterPipeline.length !== this.updatedFilterPipeline.length) {
      return true;
    }
    for (let i = 0; i < this.filterPipeline.length; i++) {
      if (typeof (this.filterPipeline[i]) !== typeof (this.updatedFilterPipeline[i])) {
        return true;
      }
      if (typeof (this.filterPipeline[i]) === "string") {
        if (this.filterPipeline[i] !== this.updatedFilterPipeline[i]) {
          return true;
        }
      }
      else {
        if (this.filterPipeline[i].length !== this.updatedFilterPipeline[i].length) {
          return true;
        }
        for (let j = 0; j < this.filterPipeline[i].length; j++) {
          if (this.filterPipeline[i][j] !== this.updatedFilterPipeline[i][j]) {
            return true;
          }
        }
      }
    }
    return false;
  }

  deleteSelected() {
    if (this.selectedConnectionId) {
      deleteConnection(this.selectedConnectionId);
    }
    if (this.nodesToDelete.length !== 0) {
      this.callDeleteAction();
    }
  }

  isEachFilterConfigured() {
    for (let i = 0; i < this.updatedFilterPipeline.length; i++) {
      if (typeof (this.updatedFilterPipeline[i]) === "string") {
        if (this.updatedFilterPipeline[i] === "Filter") {
          console.log("filter configuration not added");
          return false;
        }
      }
      else {
        if (this.updatedFilterPipeline[i].indexOf("Filter") !== -1) {
          console.log("filter configuration not added");
          return false;
        }
      }
    }
    return true;
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
    this.router.navigate(['/flow/editor', this.from, this.source, 'details']);
  }

  reload() {
    if (this.task || this.service) {
      this.router.navigate(['/flow/editor', this.from, this.source, 'details']);
      return;
    }
    this.router.navigate(['/flow/editor', this.from]);
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
      return service.status;
    } else if (this.from == 'north') {
      const task: NorthTask = this.tasks.find(task => task.name === this.serviceName);
      return task.enabled;
    }
  }

  reset() {
    resetNodes();
  }

  callUndoAction() {
    undoAction();
  }

  callRedoAction() {
    redoAction();
  }

  callDeleteAction() {
    this.nodesToDelete.forEach(node => {
      if (node.label === 'South' || node.label === 'North') {
        this.dialogServiceName = node.name;
        this.deleteService();
      } else {
        this.filterName = node.name;
        this.deleteFilterFromPipeline();
      }
    });
  }

  /**
     * Open Configure Service modal
     */
  openServiceConfigureModal() {
    this.serviceInfo.process = 'notification';
    this.router.navigate(['/developer/options/additional-services/config'], { state: { ...this.serviceInfo } });
  }

  moveNodeToFront(nodeId: string) {
    applyContentReordering(nodeId);
  }

  ngOnDestroy() {
    this.isAlive = false;
    this.subscription.unsubscribe();
    this.filterSubscription.unsubscribe();
    this.connectionSubscription.unsubscribe();
    this.serviceSubscription.unsubscribe();
    this.removeFilterSubscription.unsubscribe();
    this.exportReadingSubscription.unsubscribe();
    this.logsSubscription.unsubscribe();
    this.nodeClickSubscription.unsubscribe();
    if (this.from === 'notifications') {
      this.serviceDetailsSubscription?.unsubscribe();
      this.paramsSubscription.unsubscribe();
    }
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
