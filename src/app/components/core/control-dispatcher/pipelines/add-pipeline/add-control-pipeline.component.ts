import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { cloneDeep } from 'lodash';
import { AlertService, AssetsService, SchedulesService, NotificationsService, ProgressBarService, SharedService, ControlPipelinesService,
  FilterService, ConfigurationControlService } from '../../../../../services';
import { ControlDispatcherService } from '../../../../../services/control-dispatcher.service';
import { DialogService } from '../../../../common/confirmation-dialog/dialog.service';
import {QUOTATION_VALIDATION_PATTERN} from '../../../../../utils';
import { ConfigurationGroupComponent } from '../../../configuration-manager/configuration-group/configuration-group.component';
import { FilterAlertComponent } from '../../../filter/filter-alert/filter-alert.component';

@Component({
  selector: 'app-add-control-pipeline',
  templateUrl: './add-control-pipeline.component.html',
  styleUrls: ['./add-control-pipeline.component.css'],
})
export class AddControlPipelineComponent implements OnInit {
  @ViewChild('pipelineForm') pipelineForm: NgForm;

  stepControlsList = [];
  pipelines = [{ name: 'None' }];
  selectedExecution = '';
  selectedSourceType = {cpsid: null, name: ''};
  selectedSourceName = '';
  selectedDestinationType = {cpdid: null, name: ''};
  selectedDestinationName = '';
  public isPipelineEnabled = 'true';
  pipeline;
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
  public applicationTagClicked = false;
  public isAddFilterWizard;
  @ViewChild('filterConfigComponent') filterConfigComponent: ConfigurationGroupComponent;
  @ViewChild(FilterAlertComponent) filterAlert: FilterAlertComponent;

  constructor(
    private cdRef: ChangeDetectorRef,
    private assetService: AssetsService,
    private route: ActivatedRoute,
    private controlPipelinesService: ControlPipelinesService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService,
    private dialogService: DialogService,
    public sharedService: SharedService,
    private schedulesService: SchedulesService,
    private controlService: ControlDispatcherService,
    public notificationService: NotificationsService,
    private filterService: FilterService,
    private configurationControlService: ConfigurationControlService,
    private router: Router) { }

  ngOnInit(): void {
    this.getSourceDestTypes('source');
    this.getSourceDestTypes('destination');
    this.route.params.subscribe(params => {
      this.pipelineID = params['name'];
      if (this.pipelineID) {
        this.editMode = true;
        this.getControlPipeline();
      } else {
        this.selectedExecution = 'Shared';
        this.selectedSourceType = {cpsid: 1, name: "Any"};
        this.selectedDestinationType = {cpdid: 4, name: "Broadcast"};
      }
    });
    this.getAllPipelines(); 
  }

  ngAfterContentChecked(): void {
    this.cdRef.detectChanges();
  }

  refresh() {
    this.getControlPipeline();
  }

  onDrop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    moveItemInArray(this.filterPipeline, event.previousIndex, event.currentIndex);
    this.isFilterOrderChanged = true;
  }

  savePipelineChanges() {
    if (this.isFilterDeleted) {
      this.deleteFilter();
    }
    if (this.isFilterOrderChanged) {
      this.updateFilterPipeline(this.filterPipeline);
    }
  }

  openAddFilterModal(isClicked) {
    this.applicationTagClicked = isClicked;
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

  public updateFilterPipeline(filterPipeline) {
    this.isFilterOrderChanged = false;
    this.ngProgress.start();
    this.filterService.updateFilterPipeline({ 'pipeline': filterPipeline }, this.pipelineName)
      .subscribe(() => {
        this.ngProgress.done();
        this.alertService.success('Filter pipeline updated successfully.', true);
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
    const catName = filterName;
    this.filterService.getFilterConfiguration(catName)
      .subscribe((data: any) => {
        this.selectedFilterPlugin = data.plugin.value;
        this.filterConfiguration = { key: catName, config: data };
        this.filterConfigurationCopy = cloneDeep({ key: catName, config: data });
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
        this.pipelineName = data.name;
        this.selectedExecution = data.execution;
        this.isPipelineEnabled = data.enabled;
        this.selectedSourceName = data.source.name;
        this.selectedDestinationName = data.destination.name;
        this.filterPipeline = data.filters;
        this.sourceTypeList.forEach(type => {
          if (data.source.type === type.name) {
            this.selectedSourceType = type;
          }     
        });

        this.destinationTypeList.forEach(type => {
          if (data.destination.type === type.name) {
            this.selectedDestinationType = type;
          }      
        });

        this.pipelineForm.form.markAsUntouched();
        this.pipelineForm.form.markAsPristine();
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

  getAllPipelines() {
    this.controlPipelinesService.getAllPipelines()
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.pipelines = this.pipelines.concat(data.pipelines);
      }, error => {
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  selectValue(value, property) {
    switch (property) {
      case 'execution':
        this.selectedExecution = value === 'None' ? '' : value;
        break;
      case 'sourceType':
        this.sourceNameList = [];
        this.selectedSourceName = '';
        this.selectedSourceType = value === 'None' ? '' : value;
        this.getSourceNameList();
        break;
      case 'sourceName':
        this.selectedSourceName = value === 'None' ? '' : value;
        break;
      case 'destinationType':
        this.destinationNameList = [];
        this.selectedDestinationName = '';
        this.selectedDestinationType = value === 'None' ? '' : value;
        this.getDestinationNameList();
        break;
      case 'destinationName':
        this.selectedDestinationName = value === 'None' ? '' : value;
        break;
      default:
        break;
    }
    this.pipelineForm.form.markAsDirty();
  }

  getSourceNameList() {
    switch (this.selectedSourceType.name) {
      case 'Any':
      case 'API':
        this.selectedSourceName = '';
        break;
      case 'Service':
        this.getServiceNameList('source');
        break;
      case 'Notification':
        this.getNotificationNameList();
        break;
      case 'Schedule':
        this.getServiceNameList('source');
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
        this.selectedDestinationName = '';
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

  getServiceNameList(type) {
    let nameList = [];
    /** request started */
    this.ngProgress.start();
    this.schedulesService.getSchedules().
      subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          nameList.push('Fledge Storage');
          data.schedules.forEach(sch => {
            if (this.selectedSourceType.name === 'Service' || this.selectedDestinationType.name === 'Service') {
              if (['STARTUP'].includes(sch.type)) {
                nameList.push(sch.name);
              }
            } else {
              if (!['STARTUP'].includes(sch.type)) {
                nameList.push(sch.name);
              }
            }           
          });
          if (type === 'source') {
            this.sourceNameList = nameList;
          } else {
            this.destinationNameList = nameList;
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
    this.sourceNameList = [];
    this.notificationService.getNotificationInstance().
      subscribe(
        (data: any) => {
          data['notifications'].forEach(n => {
            this.sourceNameList.push(n.name);
          });
          console.log('sourceNameList2', this.sourceNameList);
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
    let nameList = [];
    /** request started */
    this.ngProgress.start();
    this.controlService.fetchControlServiceScripts()
      .subscribe((data: any) => {
        this.ngProgress.done();
        data.scripts.forEach(script => {
          nameList.push(script.name);
        });
        if (type === 'source') {
          this.sourceNameList = nameList;
        } else {
          this.destinationNameList = nameList;
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
    /** request started */
    this.ngProgress.start();
    this.assetService.getAsset()
      .subscribe(
        (data: any[]) => {
          /** request completed */
          this.ngProgress.done();
          data.forEach(asset => {
            this.destinationNameList.push(asset.assetCode);
          });
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
    this.controlPipelinesService.getLookup(type)
    .subscribe((data: any) => {
      this.ngProgress.done();
      if (type === 'source') {
        this.sourceTypeList = data;
        console.log('sourceTypeList', this.sourceTypeList);
      } else {
        this.destinationTypeList = data;
        console.log('destinationTypeList', this.destinationTypeList);
      }
    }, error => {
      if (error.status === 0) {
        console.log('service down ', error);
      } else {
        this.alertService.error(error.statusText);
      }
    });
  }

  onSubmit(form: NgForm) {
    const formData = cloneDeep(form.value);
    let { name } = formData;
    const payload = {
      name: name.trim(),
      execution: this.selectedExecution,
      source: {"type": this.selectedSourceType.cpsid, "name": this.selectedSourceName},
      destination: {"type": this.selectedDestinationType.cpdid, "name": this.selectedDestinationName},
      filters: [],
      enable: this.isPipelineEnabled
    }
    if (this.editMode) {
      this.updateControlScript(payload);
    } else {
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
  }

  onCheckboxClicked(event) {
    this.isPipelineEnabled = event.target.checked ? 'true' : 'false';
  }

  updateControlScript(payload) {
    /** request started */
    this.ngProgress.start();
    this.controlPipelinesService.updatePipeline(this.pipelineID, payload)
      .subscribe((data: any) => {
        this.pipelineName = payload.name;
        this.router.navigate(['control-dispatcher/pipelines']);
        this.alertService.success(data.message, true)
        /** request completed */
        this.ngProgress.done();
        this.refresh();
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
