import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { NgForm, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { cloneDeep, isEmpty, isEqual } from 'lodash';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { CustomValidator } from '../../../../../directives/custom-validator';
import {
  AlertService, AssetsService,
  ControlPipelinesService,
  FileUploaderService,
  NotificationsService, ProgressBarService,
  ResponseHandler,
  RolesService,
  SchedulesService,
  SharedService,
  ToastService
} from '../../../../../services';
import { ControlDispatcherService } from '../../../../../services/control-dispatcher.service';
import { DocService } from '../../../../../services/doc.service';
import { QUOTATION_VALIDATION_PATTERN } from '../../../../../utils';
import { DialogService } from '../../../../common/confirmation-dialog/dialog.service';
import { FilterAlertComponent } from '../../../filter/filter-alert/filter-alert.component';
import { FilterListComponent } from '../../../filter/filter-list/filter-list.component';

export interface ControlPipeline {
  id?: number
  name?: string
  source: Source
  destination: Destination
  enabled: boolean
  execution: string
  filters: string[]
}

export interface Source {
  type: string
  name: string
}

export interface Destination {
  type: string
  name: string
}


@Component({
  selector: 'app-add-control-pipeline',
  templateUrl: './add-control-pipeline.component.html',
  styleUrls: ['./add-control-pipeline.component.css'],
})
export class AddControlPipelineComponent implements OnInit {
  @ViewChild('pipelineForm') pipelineForm: NgForm;
  @ViewChild(FilterAlertComponent) filterAlert: FilterAlertComponent;
  @ViewChild('filtersListComponent') filtersListComponent: FilterListComponent;
  selectedExecution = '';
  selectedSourceType = { cpsid: null, name: '' };
  selectedSourceName = null;
  selectedDestinationType = { cpdid: null, name: '' };
  selectedDestinationName = null;
  public isPipelineEnabled = true;
  QUOTATION_VALIDATION_PATTERN = QUOTATION_VALIDATION_PATTERN;
  sourceTypeList = [];
  destinationTypeList = [];
  sourceNameList = [];
  destinationNameList = [];
  editMode = false;
  pipelineID: number;
  pipelineName;

  public filterPipeline: string[] = [];
  confirmationDialogData = {};
  public isAddFilterWizard;
  public addFilterClicked = false;
  unsavedChangesInFilterForm = false;

  controlPipeline: ControlPipeline;
  newFilterObj: { filter: string; state: string; };

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
    private docService: DocService,
    private fileUploaderService: FileUploaderService,
    private router: Router,
    private toast: ToastService) { }

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
        this.selectedSourceType = { cpsid: 1, name: "Any" };
        this.selectedDestinationType = { cpdid: 4, name: "Broadcast" };
      }
    });

    forkJoin(callsStack)
      .pipe(
        map((response: any) => {
          const sources = <Array<any>>response.sources;
          const destinations = <Array<any>>response.destinations;
          const pipelines = response.pipelines as ControlPipeline;
          const result: any[] = [];
          result.push({
            ...{ 'sources': sources },
            ...{ 'destinations': destinations },
            ...{ 'pipelines': pipelines }
          });

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

  navigateOnCPList() {
    if (this.unsavedChangesInFilterForm) {
      this.showConfirmationDialog();
      return;
    }
    this.router.navigate(['/control-dispatcher/pipelines']);
  }

  getPipelineData(pipelineData: ControlPipeline) {
    this.controlPipeline = pipelineData;
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
    this.filterPipeline = this.changeFilterNameInPipeline(pipelineData.filters);
    this.isPipelineEnabled = pipelineData.enabled;
    if (this.isAddFilterWizard) {
      this.pipelineForm.form.markAsUntouched();
      this.pipelineForm.form.markAsPristine();
    }
  }

  changeFilterNameInPipeline(filters: string[]): string[] {
    return filters?.map(f => {
      f = f.replace(`ctrl_${this.pipelineName}_`, ''); // replace ctrl_<cp-name>_ from the filter
      return f;
    });
  }

  ngAfterContentChecked(): void {
    if (this.pipelineForm) {
      this.pipelineForm.form.controls['name'].setValidators([Validators.required, CustomValidator.nospaceValidator, Validators.pattern(QUOTATION_VALIDATION_PATTERN)]);
    }
    this.cdRef.detectChanges();
  }

  openAddFilterModal(isClicked, nameValue) {
    this.addFilterClicked = isClicked;
    if ((!nameValue || nameValue === '') && !this.pipelineName) {
      return;
    }
    this.isAddFilterWizard = isClicked;
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

  addNewFitlerInPipeline(data: any) {
    this.newFilterObj = { filter: data?.filter, state: 'new'};
    if (!isEmpty(data)) {
      this.filterPipeline.push(data?.filter);
      if (data?.files.length > 0) {
        const filterName = data?.filter;
        this.uploadScript(filterName, data?.files);
      }
      this.unsavedChangesInFilterForm = true;
    }

    this.isAddFilterWizard = false;
    this.addFilterClicked = false;
  }

  updateFilterPipelineReference(filters: []) {
    this.filterPipeline = filters;
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
    if (this.unsavedChangesInFilterForm) {
      this.showConfirmationDialog();
      return;
    }
    this.router.navigate(['control-dispatcher/pipelines']);
  }

  discardUnsavedChanges() {
    this.unsavedChangesInFilterForm = false;
    if (this.addFilterClicked) {
      this.isAddFilterWizard = this.addFilterClicked;
      return;
    }
    this.router.navigate(['control-dispatcher/pipelines']);
  }

  deletePipeline(id: number) {
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
          this.pipelineForm.form.setErrors({ 'invalid': true });
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
          this.pipelineForm.form.setErrors({ 'invalid': true });
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

  checkIfSourceDestSame(source, destination) {
    if (this.selectedSourceType.name === this.selectedDestinationType.name && source.name === destination.name) {
      return true;
    }
    return false;
  }

  checkControlPipelineChange() {
    const changedCPValues: ControlPipeline = {
      execution: this.selectedExecution,
      source: { "type": this.selectedSourceType.name, "name": this.selectedSourceName },
      destination: { "type": this.selectedDestinationType.name, "name": this.selectedDestinationName },
      filters: this.filterPipeline ? this.filterPipeline : [],
      enabled: this.isPipelineEnabled
    }
    if (this.controlPipeline) {
      delete this.controlPipeline.id;
      delete this.controlPipeline.name;
      this.controlPipeline.filters = this.changeFilterNameInPipeline(this.controlPipeline.filters);
    }
    return !isEqual(this.controlPipeline, changedCPValues);
  }

  onSubmit(form: NgForm) {
    const formData = cloneDeep(form.value);
    let { name } = formData;
    const payload: ControlPipeline = {
      execution: this.selectedExecution,
      source: { "type": this.selectedSourceType.cpsid, "name": this.selectedSourceName },
      destination: { "type": this.selectedDestinationType.cpdid, "name": this.selectedDestinationName },
      filters: this.filterPipeline ? this.filterPipeline : [],
      enabled: this.isPipelineEnabled
    }

    const ifSourceDestSame = this.checkIfSourceDestSame(payload.source, payload.destination);
    if (ifSourceDestSame) {
      this.toast.error("Source and Destination can't be same.");
      return;
    }
    if (!this.editMode) {
      payload['name'] = name.trim();
    }

    if (this.unsavedChangesInFilterForm) {
      this.filtersListComponent.update();
      this.unsavedChangesInFilterForm = false;
    }

    if (this.editMode) {
      if (this.checkControlPipelineChange()) {
        this.updateControlPipeline(payload);
      }
      this.navigateOnControlPipelineListPage();
      return;
    }

    this.ngProgress.start();
    this.controlPipelinesService.createPipeline(payload)
      .subscribe(() => {
        this.ngProgress.done();
        this.alertService.success(`Control Pipeline ${payload['name']} created successfully.`);
        this.pipelineForm.form.markAsUntouched();
        this.pipelineForm.form.markAsPristine();
        this.navigateOnControlPipelineListPage();
      }, error => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  navigateOnControlPipelineListPage() {
    // small delay to effect backend changes before moving to list page 
    setTimeout(() => {
      this.router.navigate(['control-dispatcher/pipelines']);
    }, 1000);
  }

  goToLink(pluginInfo) {
    this.docService.goToPluginLink(pluginInfo);
  }

  onCheckboxClicked(event) {
    this.isPipelineEnabled = event.target.checked ? true : false;
    this.pipelineForm.form.markAsDirty();
  }

  filterFormStatus(status: boolean) {
    this.unsavedChangesInFilterForm = status;
  }

  updateControlPipeline(payload: any) {
    payload.filters = this.filterPipeline;
    /** request started */
    this.ngProgress.start();
    this.controlPipelinesService.updatePipeline(this.pipelineID, payload)
      .subscribe((data: any) => {
        this.pipelineName = payload.name;
        this.toast.success(data.message);
        /** request completed */
        this.ngProgress.done();
        this.navigateOnControlPipelineListPage();
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
