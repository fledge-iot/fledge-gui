import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';

import { RolesService, ProgressBarService } from '../../../../../services';
import { FilterAlertComponent } from '../../../filter/filter-alert/filter-alert.component';
import { ConfigurationGroupComponent } from '../../../configuration-manager/configuration-group/configuration-group.component';


@Component({
  selector: 'app-add-pipeline-filter-modal',
  templateUrl: './add-pipeline-filter.component.html',
  styleUrls: ['./add-pipeline-filter.component.css']
})
export class AddPipelineFilterComponent implements OnInit {

  public category: any;
  svcCheckbox: FormControl = new FormControl();
  public filterPipeline = [];
  public deletedFilterPipeline = [];
  public filterConfiguration: any;
  filterConfigurationCopy: any;

  public isFilterOrderChanged = false;
  public isFilterDeleted = false;
  public applicationTagClicked = false;

  public filterItemIndex;

  confirmationDialogData = {};

  @Input() pipelineName: any;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('pluginConfigComponent') pluginConfigComponent: ConfigurationGroupComponent;
  @ViewChild('filterConfigComponent') filterConfigComponent: ConfigurationGroupComponent;
  @ViewChild(FilterAlertComponent) filterAlert: FilterAlertComponent;

  // to hold child form state
  validConfigurationForm = true;
  validFilterConfigForm = true;
  pluginConfiguration;
  changedConfig: any;
  changedFilterConfig: any;
  advancedConfiguration = [];
  filterData: any;

  constructor(
    public ngProgress: ProgressBarService,
    public rolesService: RolesService) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    const alertModal = <HTMLDivElement>document.getElementById('modal-box');
    if (!alertModal.classList.contains('is-active')) {
      this.toggleModal(false);
    }
  }

  ngOnInit() { }

  public toggleModal(isOpen: Boolean) {
    const modalWindow = <HTMLDivElement>document.getElementById('pipeline-filter-modal');
    if (isOpen) {  
      this.notify.emit(this.filterData);
      modalWindow.classList.add('is-active');
      return;
    } 
    this.notify.emit(this.filterData);
    modalWindow.classList.remove('is-active');
  }

  onNotify(data) {
    this.filterData = data;
    this.toggleModal(false);
  }

}