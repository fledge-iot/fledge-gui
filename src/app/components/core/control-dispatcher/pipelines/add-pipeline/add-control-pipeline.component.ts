import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgForm, Validators } from '@angular/forms';
import { CustomValidator } from '../../../../../directives/custom-validator';
import { ActivatedRoute, Router } from '@angular/router';
import { cloneDeep, isEmpty } from 'lodash';
import { AlertService, AssetsService, SchedulesService, NotificationsService, ProgressBarService, SharedService, ControlPipelinesService,
  FilterService, ConfigurationControlService, ResponseHandler, FileUploaderService, RolesService, ConfigurationService } from '../../../../../services';
import { DocService } from '../../../../../services/doc.service';
import { ControlDispatcherService } from '../../../../../services/control-dispatcher.service';
import { DialogService } from '../../../../common/confirmation-dialog/dialog.service';
import {QUOTATION_VALIDATION_PATTERN} from '../../../../../utils';
import { ConfigurationGroupComponent } from '../../../configuration-manager/configuration-group/configuration-group.component';
import { FilterAlertComponent } from '../../../filter/filter-alert/filter-alert.component';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-add-control-pipeline',
  templateUrl: './add-control-pipeline.component.html',
  styleUrls: ['./add-control-pipeline.component.css'],
})
export class AddControlPipelineComponent implements OnInit {
  @ViewChild('pipelineForm') pipelineForm: NgForm;
  @ViewChild(FilterAlertComponent) filterAlert: FilterAlertComponent;
  @ViewChild('filterConfigComponent') filterConfigComponent: ConfigurationGroupComponent;

  pipelines = [{ name: 'None' }];
  selectedExecution = '';
  selectedSourceType = {cpsid: null, name: ''};
  selectedSourceName = null;
  selectedDestinationType = {cpdid: null, name: ''};
  selectedDestinationName = null;
  public isPipelineEnabled = true;
  QUOTATION_VALIDATION_PATTERN = QUOTATION_VALIDATION_PATTERN;
  sourceTypeList = [];
  destinationTypeList = [];
  sourceNameList = [];
  destinationNameList = [];
  editMode = false;
  pipelineID : number;
  pipelineName;

  public filterPipeline = [];
  public isFilterOrderChanged = false;
  public filterConfiguration: any;
  filterConfigurationCopy: any;
  public selectedFilterPlugin;
  changedFilterConfig: any;
  public deletedFilterPipeline = [];
  public isFilterDeleted = false;
  confirmationDialogData = {};
  public isAddFilterWizard;
  // To hold API calls to execute
  apiCallsStack = [];
  changedConfig = {};
  
  constructor(
    private cdRef: ChangeDetectorRef,
    private assetService: AssetsService,
    private route: ActivatedRoute,
    private controlPipelinesService: ControlPipelinesService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService,
    public rolesService: RolesService,
    private dialogService: DialogService,
    private response: ResponseHandler,
    public sharedService: SharedService,
    private schedulesService: SchedulesService,
    private controlService: ControlDispatcherService,
    public notificationService: NotificationsService,
    private configService: ConfigurationService,
    private filterService: FilterService,
    private docService: DocService,
    private fileUploaderService: FileUploaderService,
    private configurationControlService: ConfigurationControlService,
    private router: Router) { }

  ngOnInit(): void {
    let callsStack = {
      sources: this.controlPipelinesService.getSourceDestinationTypeList('source'),
      destinations: this.controlPipelinesService.getSourceDestinationTypeList('destination')
    }
  this.route.params.subscribe(params => {
    this.pipelineID = params['id'];
    if (this.pipelineID) {
      this.editMode = true;
      callsStack['pipelines'] = this.controlPipelinesService.getPipelineByID(this.pipelineID);
    } else {
      this.selectedExecution = 'Shared';
      this.selectedSourceType = {cpsid: 1, name: "Any"};
      this.selectedDestinationType = {cpdid: 4, name: "Broadcast"};
    }
  });

  forkJoin(callsStack)
      .pipe(
        map((response: any) => {
          const sources = <Array<any>>response.sources;
          const destinations = <Array<any>>response.destinations;
          const pipelines = <Array<any>>response.pipelines;
          const result: any[] = [];
          result.push({
            ...{ 'sources': sources}, 
            ...{ 'destinations': destinations}, 
            ...{ 'pipelines': pipelines}});

          this.sourceTypeList = sources;
          this.destinationTypeList = destinations;
          if (this.pipelineID) {
            this.getPipelineData(pipelines);
          }
          return result;
        })
      )
      .subscribe((result) => {
        result.forEach((r: any) => {
          this.ngProgress.done();
          if (r.failed) {
            if (r.error.status === 0) {
              console.log('service down ', r.error);
            } else {
              this.alertService.error(r.error.statusText);
            }
          } else {
            this.response.handleResponseMessage(r.type);
          }
        });
      });
  }

  getPipelineData(pipelineData) {
    this.pipelineName = pipelineData.name;
    this.selectedExecution = pipelineData.execution;
    this.sourceTypeList.forEach(type => {
      if (pipelineData.source.type === type.name) {
        this.selectedSourceType = type;
      }
    });
    // get Source Name list
    this.selectValue(this.selectedSourceType, 'sourceType');
    this.selectedSourceName = pipelineData.source.name;
    this.destinationTypeList.forEach(type => {
      if (pipelineData.destination.type === type.name) {
        this.selectedDestinationType = type;
      }      
    });
    // get Destination Name list
    this.selectValue(this.selectedDestinationType, 'destinationType');
    this.selectedDestinationName = pipelineData.destination.name;
    this.filterPipeline = [];
    pipelineData.filters.forEach((filter) => {
      let fNamePrefix: string = `ctrl_${this.pipelineName}_`;
      const filterName = filter.replace(fNamePrefix, '');
      this.filterPipeline.push(filterName);
    });
    this.isPipelineEnabled = pipelineData.enabled;   
    if (this.isAddFilterWizard) {
      this.pipelineForm.form.markAsUntouched();
      this.pipelineForm.form.markAsPristine();
    }
  }

  ngAfterContentChecked(): void {
    if (this.pipelineForm) {
      this.pipelineForm.form.controls['name'].setValidators([Validators.required, CustomValidator.nospaceValidator, Validators.pattern(QUOTATION_VALIDATION_PATTERN)]);
    }
    this.cdRef.detectChanges();
  }

  onDrop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    moveItemInArray(this.filterPipeline, event.previousIndex, event.currentIndex);
    this.isFilterOrderChanged = true;
    this.pipelineForm.form.markAsDirty();
  }

  openAddFilterModal(isClicked, nameValue) {
    if ((!nameValue || nameValue === '') && !this.pipelineName){
      return;
    }
    if (this.isFilterOrderChanged || this.isFilterDeleted) {
      this.showConfirmationDialog();
      return;
    }
    this.isAddFilterWizard = isClicked;
    this.isFilterOrderChanged = false;
    this.isFilterDeleted = false;
    this.deletedFilterPipeline = [];
  }

  /**
  * Open confirmation modal
  */
   showConfirmationDialog() {
    this.confirmationDialogData = {
      id: '',
      name: '',
      message: 'Do you want to discard unsaved changes?',
      key: 'unsavedConfirmation'
    };
    this.filterAlert.toggleModal(true);
  }

  onNotify(data) {
    const filterData = data ? data.filters : [];
    let filtersList = [];
    // Append recently added filter to existing filter pipeline
    // format of previously added filter is ctrl_{control pipeline name}_{filter name}. To send filter in updated payload,
    // we have to change format of filter "ctrl_{control pipeline name}_{filter name}" to "{filter name}"
    if (data && this.filterPipeline.length > 0) {
      this.filterPipeline.forEach((filter) => {
        let fNamePrefix: string = `ctrl_${this.pipelineName}_`;
        const filterName = filter.replace(fNamePrefix, '');
        filtersList.push(filterName);
      });
    }
    if (data?.files.length > 0) {
      const filterName = data?.filters[0];
      this.uploadScript(filterName, data?.files);
    }
    this.filterPipeline = filtersList.concat(filterData);
    if (this.pipelineID) {
      if (data?.filters.length > 0) {
           this.updateControlPipeline({filters: this.filterPipeline}, true)
        }
       this.getControlPipeline();
    }
    if (this.pipelineForm) {
      this.pipelineForm.form.controls['name'].setValidators([Validators.required, CustomValidator.nospaceValidator, Validators.pattern(QUOTATION_VALIDATION_PATTERN)]);
    }
    this.isAddFilterWizard = false;
  }

  deleteFilter() {
    this.isFilterDeleted = false;
    this.ngProgress.start();
    this.filterService.updateFilterPipeline({ 'pipeline': this.filterPipeline }, this.pipelineName)
      .subscribe(() => {
        this.deletedFilterPipeline.forEach((filter, index) => {
          this.filterService.deleteFilter(filter).subscribe((data: any) => {
            this.ngProgress.done();
            if (this.deletedFilterPipeline.length === index + 1) {
              this.deletedFilterPipeline = []; // clear deleted filter reference
            }
            this.alertService.success(data.result, true);
          },
            (error) => {
              this.ngProgress.done();
              if (error.status === 0) {
                console.log('service down ', error);
              } else {
                this.alertService.error(error.statusText);
              }
            });
        });
      },
        (error) => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  getFilterConfiguration(filterName: string) {
    this.filterService.getFilterConfiguration(filterName)
      .subscribe((data: any) => {
        this.selectedFilterPlugin = data.plugin.value;
        this.filterConfiguration = { key: filterName, config: data };
        this.filterConfigurationCopy = cloneDeep({ key: filterName, config: data });
        this.filterConfigComponent?.updateCategroyConfig(data);
      },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  deleteFilterReference(filter) {
    this.deletedFilterPipeline.push(filter);
    this.filterPipeline = this.filterPipeline.filter(f => f !== filter);
    this.isFilterDeleted = true;
    this.isFilterOrderChanged = false;
  }

  activeAccordion(id, filterName: string) {
    const last = <HTMLElement>document.getElementsByClassName('accordion card is-active')[0];
    if (last !== undefined) {
      const lastActiveContentBody = <HTMLElement>last.getElementsByClassName('card-content')[0];
      const activeId = last.getAttribute('id');
      lastActiveContentBody.hidden = true;
      last.classList.remove('is-active');
      if (id !== +activeId) {
        const next = <HTMLElement>document.getElementById(id);
        const nextActiveContentBody = <HTMLElement>next.getElementsByClassName('card-content')[0];
        nextActiveContentBody.hidden = false;
        next.setAttribute('class', 'accordion card is-active');
        this.getFilterConfiguration(filterName);
      } else {
        last.classList.remove('is-active');
        lastActiveContentBody.hidden = true;
      }
    } else {
      const element = <HTMLElement>document.getElementById(id);
      const body = <HTMLElement>element.getElementsByClassName('card-content')[0];
      body.hidden = false;
      element.setAttribute('class', 'accordion card is-active');
      this.getFilterConfiguration(filterName);
    }
  }

  getControlPipeline() {
    /** request started */
    this.ngProgress.start();
    this.controlPipelinesService.getPipelineByID(this.pipelineID)
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.getPipelineData(data);
      }, error => {
        /** request completed */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  onCancel() {
    if (this.isFilterOrderChanged || this.isFilterDeleted) {
      this.showConfirmationDialog();
      return;
    }
    this.router.navigate(['control-dispatcher/pipelines']);
  }

  discardChanges() {
    this.isFilterOrderChanged = false;
    this.isFilterDeleted = false;
    this.deletedFilterPipeline = [];
    this.router.navigate(['control-dispatcher/pipelines']);
  }

  /**
  * Get edited filter configuration
  * @param changedConfiguration changed configuration of a selected filter
  */
   getChangedFilterConfig(changedConfiguration: any) {
    this.changedFilterConfig = this.configurationControlService.getChangedConfiguration(changedConfiguration, this.filterConfigurationCopy);
  }

  deletePipeline(id) {
    /** request started */
    this.ngProgress.start();
    this.controlPipelinesService.deletePipeline(id)
      .subscribe((data: any) => {
        this.ngProgress.done();
        // close modal
        this.closeModal('confirmation-dialog');
        this.router.navigate(['control-dispatcher/pipelines']);
        this.alertService.success(data.message);
      }, error => {
        /** request completed */
        this.ngProgress.done();
        // close modal
        this.closeModal('confirmation-dialog');
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  public toggleDropdown(id) {
    const activeDropDowns = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDowns.length > 0) {
      if (activeDropDowns[0].id !== id) {
        activeDropDowns[0].classList.remove('is-active');
      }
    }
    const dropDown = document.querySelector(`#${id}`);
    dropDown.classList.toggle('is-active');
  }

  selectValue(value, property) {
    switch (property) {
      case 'execution':
        this.selectedExecution = value === 'Select Execution' ? '' : value;
        break;
      case 'sourceType':
        this.sourceNameList = [];
        this.selectedSourceName = null;
        this.selectedSourceType = value === 'Select Source Type' ? '' : value;
        this.getSourceNameList();
        // mark form invalid, if Source/Destination Name is not selected yet
        if (!['API', 'Any'].includes(this.selectedSourceType.name)) {
          this.pipelineForm.form.setErrors({'invalid': true});
        }
        break;
      case 'sourceName':
        this.selectedSourceName = value === 'Select Source Name' ? null : value;
        // mark form valid, if Source/Destination Name selected Or Source/Destination Type is ['API', 'Any']/['Broadcast]
        if (this.selectedDestinationType.name === 'Broadcast' || (this.selectedDestinationName !== null && this.selectedSourceName !== null)) {
          this.pipelineForm.form.setErrors(null);
        }
        break;
      case 'destinationType':
        this.destinationNameList = [];
        this.selectedDestinationName = null;
        this.selectedDestinationType = value === 'Select Destination Type' ? '' : value;
        this.getDestinationNameList();
        // mark form invalid, if Source/Destination Name is not selected yet
        if (this.selectedDestinationType.name !== 'Broadcast') {
          this.pipelineForm.form.setErrors({'invalid': true});
        }
        break;
      case 'destinationName':
        this.selectedDestinationName = value === 'Select Destination Name' ? null : value;
        // mark form valid, if Source/Destination Name selected Or Source/Destination Type is ['API', 'Any']/['Broadcast]
        if (['API', 'Any'].includes(this.selectedSourceType.name) || (this.selectedSourceName !== null && this.selectedDestinationName !== null)) {
          this.pipelineForm.form.setErrors(null);
        }
        break;
      default:
        break;
    }
  }

  getSourceNameList() {
    switch (this.selectedSourceType.name) {
      case 'Any':
      case 'API':
        this.selectedSourceName = null;
        break;
      case 'Service':
      case 'Schedule':
        this.getServiceNameList('source');
        break;
      case 'Notification':
        this.getNotificationNameList();
        break;
      case 'Script':
        this.getScriptNameList('source');
        break;
      default:
        break;
    }
  }

  getDestinationNameList() {
    switch (this.selectedDestinationType.name) {
      case 'Broadcast':
        this.selectedDestinationName = null;
        break;
      case 'Service':
        this.getServiceNameList('destination');
        break;
      case 'Asset':
        this.getAssetNameList();
        break;
      case 'Script':
        this.getScriptNameList('destination');
        break;
      default:
        break;
    }
  }

  getServiceNameList(direction) {
    let names = [];
    /** request started */
    this.ngProgress.start();
    this.schedulesService.getSchedules().
      subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          data.schedules.forEach(sch => {
            if ((direction === 'source' && this.selectedSourceType.name === 'Service') || (direction === 'destination' && this.selectedDestinationType.name === 'Service')) {
              if (['STARTUP'].includes(sch.type) && ['south_c', 'north_C'].includes(sch.processName)) {
                if (sch.processName === 'south_c') {
                  sch.groupbyType = 'Southbound';
                }
                if (sch.processName === 'north_C') {
                  sch.groupbyType = 'Northbound';
                }
                names.push(sch);
              }
            } else {
              if (!['STARTUP'].includes(sch.type)) {
                names.push(sch);
              }
            }           
          });
          let southboundSvc = [];
          let northboundSvc = [];
          names.forEach(svc => {
            if (svc.processName === 'south_c') {
              southboundSvc.push(svc);
            } else {
              northboundSvc.push(svc);
            }
          })
          const SortedSouthboundSvc = southboundSvc.sort((a, b) => a.name.localeCompare(b.name));
          const SortedNorthboundSvc = northboundSvc.sort((a, b) => a.name.localeCompare(b.name));
          if (direction === 'source') {
            this.sourceNameList = SortedSouthboundSvc.concat(SortedNorthboundSvc);
          } else {
            this.destinationNameList = SortedSouthboundSvc.concat(SortedNorthboundSvc);
          }
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  getNotificationNameList() {
    this.notificationService.getNotificationInstance().
      subscribe(
        (data: any) => {
          this.sourceNameList = data['notifications'].sort((a, b) => a.name.localeCompare(b.name))
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  getScriptNameList(type) {
    /** request started */
    this.ngProgress.start();
    this.controlService.fetchControlServiceScripts()
      .subscribe((data: any) => {
        this.ngProgress.done();
        if (type === 'source') {
          this.sourceNameList = data.scripts.sort((a, b) => a.name.localeCompare(b.name));
        } else {
          this.destinationNameList = data.scripts.sort((a, b) => a.name.localeCompare(b.name));
        }
      }, error => {
        /** request completed */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  getAssetNameList() {
    let nameList = [];
    /** request started */
    this.ngProgress.start();
    this.assetService.getAsset()
      .subscribe(
        (data: any[]) => {
          /** request completed */
          this.ngProgress.done();
          data.forEach(asset => {
            asset['name'] = asset.assetCode;
            nameList.push(asset);
          });
          this.destinationNameList = nameList.sort((a, b) => a.name.localeCompare(b.name));
        },
        error => {
          /** request completed but error */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  getSourceDestTypes(type) {
    this.controlPipelinesService.getSourceDestinationTypeList(type)
    .subscribe((data: any) => {
      this.ngProgress.done();
      if (type === 'source') {
        this.sourceTypeList = data;
      } else {
        this.destinationTypeList = data;
      }
    }, error => {
      if (error.status === 0) {
        console.log('service down ', error);
      } else {
        this.alertService.error(error.statusText);
      }
    });
  }

  /**
  * To upload script files of a configuration property
  * @param categoryName name of the configuration category
  * @param files : Scripts array to uplaod
  */
  public uploadScript(categoryName: string, files: any[]) {
    this.fileUploaderService.uploadConfigurationScript(categoryName, files);
  }

  /**
  * Get scripts to upload from a configuration item
  * @param configuration  edited configuration from show configuration page
  * @returns script files to upload
  */
   getScriptFilesToUpload(configuration: any) {
    return this.fileUploaderService.getConfigurationPropertyFiles(configuration);
  }

  /**
   * update plugin configuration
   */
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

  onSubmit(form: NgForm) {
    const formData = cloneDeep(form.value);
    let { name } = formData;
    const payload = {
      execution: this.selectedExecution,
      source: {"type": this.selectedSourceType.cpsid, "name": this.selectedSourceName},
      destination: {"type": this.selectedDestinationType.cpdid, "name": this.selectedDestinationName},
      filters: this.filterPipeline ? this.filterPipeline : [],
      enabled: this.isPipelineEnabled
    }
    if (!this.editMode) {
      payload['name'] = name.trim();
    }
    if (!isEmpty(this.changedFilterConfig) && this.filterConfigurationCopy?.key) {
      this.updateConfiguration(this.filterConfigurationCopy.key, this.changedFilterConfig, 'filter-config');
    }

    if (this.apiCallsStack.length > 0) {
      this.ngProgress.start();
      forkJoin(this.apiCallsStack).subscribe((result) => {
        result.forEach((r: any) => {
          this.ngProgress.done();
          if (r.failed) {
            if (r.error.status === 0) {
              console.log('service down ', r.error);
            } else {
              this.alertService.error(r.error.statusText);
            }
          } else {
            this.response.handleResponseMessage(r.type);
          }
        });
        form.reset();
        this.apiCallsStack = [];
      });
    }

    // if ((payload.source.type !== 1 || payload.source.type !== 3 && payload.source.name === '') || (payload.destination.type !== 4 && payload.destination.name === '')) {
    //   return;
    // }
    if (this.editMode) {
      this.updateControlPipeline(payload);
      return;
    }   
    this.ngProgress.start();
    this.controlPipelinesService.createPipeline(payload)
      .subscribe(() => {
        this.ngProgress.done();
        this.alertService.success(`Control Pipeline ${payload['name']} created successfully.`);
        this.pipelineForm.form.markAsUntouched();
        this.pipelineForm.form.markAsPristine();
        setTimeout(() => {
          this.router.navigate(['control-dispatcher/pipelines']);
        }, 1000);
      }, error => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  goToLink(pluginInfo) {
    this.docService.goToPluginLink(pluginInfo);
  }

  onCheckboxClicked(event) {
    this.isPipelineEnabled = event.target.checked ? true : false;
    this.pipelineForm.form.markAsDirty();
  }

  updateControlPipeline(payload, isFilterUpdated = false) {
    /** request started */
    this.ngProgress.start();
    this.controlPipelinesService.updatePipeline(this.pipelineID, payload)
      .subscribe((data: any) => {
        this.pipelineName = payload.name;

        // If info other than filter pipeline updated, then redirect to Control Pipeline list page otherwise stay on Add/Detail page
        if (!isFilterUpdated) {
          this.router.navigate(['control-dispatcher/pipelines']);
        } else {
          this.getControlPipeline();
        }
        this.alertService.success(data.message, true)
        /** request completed */
        this.ngProgress.done();
      }, error => {
        /** request completed */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

}
