import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { orderBy } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';
import { Router } from '@angular/router';

import { AlertService, ControlPipelinesService, ProgressBarService, RolesService } from '../../../../services';

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

  constructor(private controlPipelinesService: ControlPipelinesService,
    private alertService: AlertService,
    private ngProgress: ProgressBarService,
    private router: Router,
    public rolesService: RolesService) {}

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
          this.pipelines = orderBy(data.pipelines, ['name'], ['asc']);
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

  public toggleDropdown(contextMenu) {
    const id = 'dropdown-' + contextMenu;
    const activeDropDowns = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDowns.length > 0) {
      if (activeDropDowns[0].id !== id) {
        activeDropDowns[0].classList.remove('is-active');
      }
    }
    const dropDown = document.querySelector(`#${id}`);
    dropDown.classList.toggle('is-active');
  }

  deletePipeline(id) {
    /** request started */
    this.ngProgress.start();
    this.controlPipelinesService.deletePipeline(id).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
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

  public ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
