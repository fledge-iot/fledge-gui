import { Component, ElementRef, EventEmitter, HostListener, Injector, OnInit, ViewChild } from '@angular/core';
import { createEditor, getUpdatedFilterPipeline, deleteConnection, removeNode, updateNode } from './editor';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ConfigurationControlService,
  ConfigurationService,
  FileUploaderService,
  FilterService,
  NorthService,
  PingService,
  ProgressBarService,
  ResponseHandler,
  RolesService,
  ServicesApiService,
  ToastService
} from './../../../services';
import { catchError, delay, map, mergeMap, repeatWhen, skip, take, takeUntil, takeWhile } from 'rxjs/operators';
import { Service } from '../../core/south/south-service';
import { EMPTY, Subject, Subscription, forkJoin, interval, of } from 'rxjs';
import { FlowEditorService } from './flow-editor.service';
import { cloneDeep, isEmpty } from 'lodash';
import { DialogService } from '../confirmation-dialog/dialog.service';
import { NorthTask } from '../../core/north/north-task';
import Utils, { POLLING_INTERVAL } from '../../../utils';

@Component({
  selector: 'app-node-editor',
  templateUrl: './node-editor.component.html',
  styleUrls: ['./node-editor.component.css']
})
export class NodeEditorComponent implements OnInit {

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

  showPluginConfiguration: boolean = false;
  showFilterConfiguration: boolean = false;
  showLogs: boolean = false;
  showTaskSchedule = false;
  service: Service;
  task: NorthTask;
  services: Service[] = [];
  tasks: NorthTask[] = [];
  destroy$: Subject<boolean> = new Subject<boolean>();
  serviceName = '';
  filterName = '';
  deleteServiceName = '';
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
  quickviewFilterName = "";
  isAddFilterWizard: boolean = false;
  isAlive: boolean;

  taskSchedule = { id: '', name: '', exclusive: false, repeatTime: '', repeatDays: 0 };

  constructor(public injector: Injector,
    private route: ActivatedRoute,
    private filterService: FilterService,
    private servicesApiService: ServicesApiService,
    private configService: ConfigurationService,
    public flowEditorService: FlowEditorService,
    private configurationControlService: ConfigurationControlService,
    private fileUploaderService: FileUploaderService,
    private toastService: ToastService,
    public rolesService: RolesService,
    private response: ResponseHandler,
    public ngProgress: ProgressBarService,
    private dialogService: DialogService,
    private northService: NorthService,
    private ping: PingService,
    private router: Router) {
    this.route.params.subscribe(params => {
      this.from = params.from;
      this.source = params.name;
      if (this?.from === 'south') {
        this.getSouthboundServices();
      } else {
        this.getNorthboundServices();
      }

      if (this.source) {
        this.getFilterPipeline();
      }
    });
  }

  @HostListener('document:keydown.delete', ['$event']) onKeydownHandler() {
    this.deleteSelectedConnection();
  }
  @HostListener('click')
  onClick() {
    if (this.rolesService.hasEditPermissions()) {
      this.flowEditorService.canvasClick.next({ canvasClicked: true, connectionId: this.selectedConnectionId });
    }
  }
  ngOnInit(): void {
    this.subscription = this.flowEditorService.showItemsInQuickview.pipe(skip(1)).subscribe(data => {
      this.showPluginConfiguration = data.showPluginConfiguration;
      this.showFilterConfiguration = data.showFilterConfiguration;
      this.showLogs = data.showLogs;
      this.showTaskSchedule = data.showTaskSchedule;
      this.serviceName = data.serviceName;
      if (this.showPluginConfiguration) {
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
            if(this.from === 'north' && this.isFilterPipelineComplex(updatedPipeline)){
              console.log("Complex pipeline not allowed on north side");
              return;
            }
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
      this.openModal('delete-service-dialog');
      this.deleteServiceName = data.name;
    });

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
          this.getNorthasks();
        } else {
          this.getSouthervices();
        }
      });
    this.removeFilterSubscription = this.flowEditorService.removeFilter.pipe(skip(1)).subscribe(data => {
      if(data){
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
        filterConfigurations: this.filterConfigurations,
      }

      let isServiceExist = true;
      if (this.initialApiCallsStack.length > 0) {
        this.ngProgress.start();
        forkJoin(this.initialApiCallsStack)
          .pipe(mergeMap(res => {
            // Retry GET tasks call when task as a service created. Service takes time to populate in the GET tasks response
            if (this.source && this.from == 'north') {
              const tasks = res[0]['tasks'];
              isServiceExist = tasks?.some(t => (t.name == this.source));
            }
            return !isServiceExist ? EMPTY : of(res);
          }),
            repeatWhen(notifications => {
              return notifications.pipe(
                delay(2000),
                takeWhile(() => !isServiceExist)
              )
            }),
            take(1)
          )
          .subscribe((result) => {
            this.ngProgress.done();
            result.forEach((r: any) => {
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
                } else {
                  if (r.services) {
                    const services = r.services as Service[];
                    this.services = services;
                    this.service = services.find(service => (service.name == this.source));
                    data.services = services;
                    data.service = this.service;
                  }
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
                createEditor(el, this.injector, this.flowEditorService, this.rolesService, data);
                this.filterConfigApiCallsStack = [];
              });
            }
            else {
              createEditor(el, this.injector, this.flowEditorService, this.rolesService, data);
            }
          });
      }
    }
  }

  getNorthasks() {
    this.northService.getNorthTasks(true)
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

  getSouthervices() {
    this.servicesApiService.getSouthServices(true)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        const services = data.services as Service[];
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

  getFilterPipeline() {
    this.initialApiCallsStack.push(this.filterService.getFilterPipeline(this.source)
      .pipe(map(response => response))
      .pipe(catchError(error => of(error))))
  }

  getSouthboundServices() {
    this.initialApiCallsStack.push(this.servicesApiService.getSouthServices(true)
      .pipe(takeUntil(this.destroy$))
    )
  }

  getNorthboundServices() {
    this.initialApiCallsStack.push(this.northService.getNorthTasks(true)
      .pipe(map(response => ({ tasks: response })), takeUntil(this.destroy$))
    )
  }

  public getCategory(): void {
    /** request started */
    this.configService.getCategory(this.serviceName).
      subscribe(
        (data) => {
          this.changedConfig = [];
          this.advancedConfiguration = [];
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
      if(this.from === 'north' && this.isFilterPipelineComplex(updatedPipeline)){
        console.log("Complex pipeline not allowed on north side");
        return;
      }
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

  deleteSelectedConnection() {
    if (this.selectedConnectionId) {
      deleteConnection(this.selectedConnectionId);
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
      this.updateConfiguration(catName, this.changedFilterConfig, 'plugin-config');
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

  checkFormState() {
    const noChange = isEmpty(this.changedConfig) && isEmpty(this.advancedConfiguration);
    return noChange;
  }

  checkFilterFormState() {
    const noChange = isEmpty(this.changedFilterConfig);
    return noChange;
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
      return;
    }
    this.apiCallsStack.push(this.configService.
      updateBulkConfiguration(categoryName, configuration)
      .pipe(map(() => ({ type, success: true })))
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
    this.servicesApiService.deleteService(this.deleteServiceName)
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

  getChangedFilterConfig(changedConfiguration: any) {
    this.changedFilterConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, this.filterPluginConfiguration);
  }

  onNotify() {
    this.isAddFilterWizard = false;
    this.router.navigate(['/flow/editor', this.from, this.source, 'details']);
  }

  reload() {
    this.router.navigate(['/flow/editor', this.from, this.source, 'details']);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.filterSubscription.unsubscribe();
    this.connectionSubscription.unsubscribe();
    this.serviceSubscription.unsubscribe();
    this.removeFilterSubscription.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
