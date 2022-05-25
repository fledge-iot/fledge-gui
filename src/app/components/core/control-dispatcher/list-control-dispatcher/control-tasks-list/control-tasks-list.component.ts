import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import {
  AlertService,
  SharedService,
  ProgressBarService,
  SchedulesService,
  ConfigurationService
} from '../../../../../services';
import { ControlDispatcherService } from '../../../../../services/control-dispatcher.service';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { DialogService } from '../../confirmation-dialog/dialog.service';
import { orderBy, isEmpty } from 'lodash';

@Component({
  selector: 'app-control-tasks-list',
  templateUrl: './control-tasks-list.component.html',
  styleUrls: ['./control-tasks-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ControlTasksListComponent implements OnInit {
  controlScripts: any = [];
  script;
  @ViewChild('confirmationDialog') confirmationDialog: ConfirmationDialogComponent;
  @ViewChild('start-schedule-dialog') startScheduleDialog: ConfirmationDialogComponent;
  controlTask;
  constructor(private controlService: ControlDispatcherService,
    private schedulesService: SchedulesService,
    private configurationService: ConfigurationService,
    private alertService: AlertService,
    private dialogService: DialogService,
    public sharedService: SharedService,
    private cd: ChangeDetectorRef,
    private ngProgress: ProgressBarService) { }

  ngOnInit(): void {
    this.getControlScripts();
  }

  setScript(script: any) {
    this.script = script;
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  getControlScripts() {
    /** request started */
    this.ngProgress.start();
    this.controlService.fetchControlServiceScripts()
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.controlScripts = orderBy(data.scripts, 'name');
        this.controlScripts = this.controlScripts.filter(c => !isEmpty(c.schedule))
        this.cd.detectChanges();
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
   * Delete control schedule
   *
   * To delete control script schedule first disable schedule,
   * and delete schedule then delete configuration category
   *
   * @param script Object
   */
  deleteControlSchedule(script) {
    const id = script.schedule.id;
    /** request started */
    this.ngProgress.start();
    // disable schedule
    this.schedulesService.disableSchedule(id)
      .subscribe(() => {
        // delete schedule
        this.schedulesService.deleteSchedule(id)
          .subscribe((data: any) => {
            this.ngProgress.done();
            this.alertService.success(data.message);
            const categoryName = script?.configuration?.categoryName;
            // close modal
            this.closeModal('confirmation-dialog');
            // delete category
            this.configurationService.deleteCategory(categoryName).subscribe((data: any) => {
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
          }, () => {
            this.getControlScripts();
            this.cd.detectChanges();
          });
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

  getScriptParameters(value) {
    let config = JSON.parse(value);
    const params = config.map(c => c.values);
    const parameters = [];
    params.forEach(element => {
      for (const [key, value] of Object.entries(element)) {
        parameters.push({ key, value })
      }
    });
    return parameters;
  }

  getScriptServicesUsage(value) {
    let config = JSON.parse(value);
    return [...new Set(config.map(c => c.service))];
  }

  updateScheduleStatus(schedule) {
    if (!schedule.enabled) {
      this.enableSchedule(schedule);
    } else {
      this.disableSchedule(schedule);
    }
  }

  enableSchedule(schedule) {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.enableScheduleByName(schedule.name).
      subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data.message, true);
          // update local reference of schedule
          schedule.enabled = true;
          this.cd.detectChanges();
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

  disableSchedule(schedule) {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.disableScheduleByName(schedule.name).
      subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data.message, true);
          // update local reference of schedule
          schedule.enabled = false;
          this.cd.detectChanges();
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

  startSchedule(id: string) {
    /** request started */
    this.ngProgress.start();
    this.schedulesService.startSchedule(id).
      subscribe(
        (data: any) => {
          console.log('data', data);
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data.message, true);
          this.cd.detectChanges();
          // close modal
          this.closeModal('start-schedule-dialog');
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

}
