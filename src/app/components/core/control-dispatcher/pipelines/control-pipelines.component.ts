import { Component, OnDestroy, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { orderBy } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';
import { Router } from '@angular/router';
import { DocService } from '../../../../services/doc.service';
import { AlertService, ControlPipelinesService, ProgressBarService, RolesService } from '../../../../services';
import { ListAdditionalServicesComponent } from '../../developer/additional-services/list-additional-services.component';
import { AddDispatcherServiceComponent } from './../add-dispatcher-service/add-dispatcher-service.component';

@Component({
  selector: 'app-control-pipelines',
  templateUrl: './control-pipelines.component.html',
  styleUrls: ['./control-pipelines.component.css']
})
export class ControlPipelinesComponent implements OnInit, OnDestroy {
  @ViewChild(AlertDialogComponent, { static: true }) child: AlertDialogComponent;
  @ViewChild(ListAdditionalServicesComponent, { static: true }) listAdditionalServicesComponent: ListAdditionalServicesComponent;
  @ViewChild(AddDispatcherServiceComponent, { static: true }) addDispatcherServiceComponent: AddDispatcherServiceComponent;

  pipelines = [];
  public showSpinner = false;
  public childData = {};
  isServiceAvailable = false;

  destroy$: Subject<boolean> = new Subject<boolean>();

  public reenableButton = new EventEmitter<boolean>(false);
  showConfigureModal: boolean = false;

  constructor(private controlPipelinesService: ControlPipelinesService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService,
    private router: Router,
    public rolesService: RolesService,
    public docService: DocService,) {}

  ngOnInit() {
    this.showLoadingSpinner();
    this.getControlPipelines();
  }

  public getControlPipelines(showProgressBar = true): void {
    /** request started */
    if (showProgressBar) {
      this.ngProgress.start();
    }
    this.controlPipelinesService.getAllPipelines()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          let enabledPipeline = [];
          let disabledPipeline = [];
          this.pipelines = [];
          // Sort pipeline by name and group by enabled (enabled first)
          data.pipelines.forEach((pipeline) => {
            if (pipeline.enabled) {
              enabledPipeline.push(pipeline)
            } else {
              disabledPipeline.push(pipeline)
            }
          });
          this.pipelines = orderBy(enabledPipeline, 'name').concat(orderBy(disabledPipeline, 'name'));
          this.hideLoadingSpinner();
        },
        error => {
          /** request completed but error */
          this.ngProgress.done();
          this.hideLoadingSpinner();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  goToLink(urlSlug: string) {
    this.docService.goToSetPointControlDocLink(urlSlug);
  }

  deletePipeline(id) {
    /** request started */
    this.ngProgress.start();
    this.controlPipelinesService.deletePipeline(id).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.reenableButton.emit(false);
          this.alertService.success(data['message']);
          // delete pipeline locally from pipelines array
          const index: number = this.pipelines.findIndex((pipeline) => pipeline.id === id);
          if (index !== -1) {
            this.pipelines.splice(index, 1);
          }
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          this.reenableButton.emit(false);
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  /**
  * Open delete record modal dialog
  * @param id   pipeline id to delete
  * @param name pipeline name
  */
   openModal(id, name, key, message) {
    this.childData = {
      id: id,
      name: name,
      key: key,
      message: message,
    };

    // call child component method to toggle modal
    this.child.toggleModal(true);
  }

  addControlPipeline() {
    this.router.navigate(['/control-dispatcher/pipelines/add']);
  }

  onCheckboxClicked(event, pipelineID) {
    const payload = {
      'enabled': event.target.checked
    }
    /** request started */
    this.ngProgress.start();
    this.controlPipelinesService.updatePipeline(pipelineID, payload)
      .subscribe((data: any) => {
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

  getFiltersName(filters, pipelineName) {
    let filterPipeline = [];
    filters.forEach((filter) => {
      let fNamePrefix: string = `ctrl_${pipelineName}_`;
      const filterName = filter.replace(fNamePrefix, '');
      filterPipeline.push(filterName);
    });
    return filterPipeline;
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  /**
 * Open Configure Service modal
 */
  openServiceConfigureModal() {
    this.showConfigureModal = true;
    this.listAdditionalServicesComponent.showServices('dispatcher');
  }

  onNotify(event) {
    if (event?.isCancelEvent) {
      return;
    } else {
      this.addDispatcherServiceComponent.getInstalledServicesList();
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
