import { Component, OnDestroy, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { orderBy } from 'lodash';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';
import { Router, ActivatedRoute } from '@angular/router';
import { DocService } from '../../../../services/doc.service';
import { AlertService, ControlPipelinesService, ProgressBarService, RolesService, SharedService } from '../../../../services';
import { AdditionalServicesUtils } from '../../developer/additional-services/additional-services-utils.service';

@Component({
  selector: 'app-control-pipelines',
  templateUrl: './control-pipelines.component.html',
  styleUrls: ['./control-pipelines.component.css']
})
export class ControlPipelinesComponent implements OnInit, OnDestroy {
  @ViewChild(AlertDialogComponent, { static: true }) child: AlertDialogComponent;

  pipelines = [];
  public showSpinner = false;
  public childData = {};

  destroy$: Subject<boolean> = new Subject<boolean>();
  private serviceDetailsSubscription: Subscription;

  public reenableButton = new EventEmitter<boolean>(false);
  serviceInfo = { added: false, type: '', isEnabled: true, process: 'dispatcher', name: '', isInstalled: false };

  constructor(private controlPipelinesService: ControlPipelinesService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService,
    private router: Router,
    public rolesService: RolesService,
    public sharedService: SharedService,
    public activatedRoute: ActivatedRoute,
    private additionalServicesUtils: AdditionalServicesUtils,
    public docService: DocService,) {
    this.activatedRoute.paramMap
      .pipe(map(() => window.history.state)).subscribe((data: any) => {
        if (!data?.shouldSkipCalls) {
          this.additionalServicesUtils.getAllServiceStatus(false, 'dispatcher');
        }
      })
  }

  ngOnInit() {
    this.serviceDetailsSubscription = this.sharedService.installedServicePkgs.subscribe(service => {
      if (service) {
        const dispatcherServiceDetail = service.installed.find(s => s.process == 'dispatcher');
        if (dispatcherServiceDetail) {
          this.serviceInfo.isEnabled = ["shutdown", "disabled", "installed"].includes(dispatcherServiceDetail?.state) ? false : true;
          this.serviceInfo.isInstalled = true;
          this.serviceInfo.added = dispatcherServiceDetail?.added;
          this.serviceInfo.name = dispatcherServiceDetail?.name;
        } else {
          this.serviceInfo.isEnabled = false;
          this.serviceInfo.isInstalled = false;
          this.serviceInfo.added = false;
          this.serviceInfo.name = '';
        }
      }
    });
    this.showLoadingSpinner();
    this.getControlPipelines();
  }

  refreshServiceInfo() {
    this.additionalServicesUtils.getAllServiceStatus(false, 'dispatcher');
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
    this.router.navigate(['/developer/options/additional-services/config'], { state: { ...this.serviceInfo } });
  }

  public ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    this.serviceDetailsSubscription.unsubscribe();
  }
}
