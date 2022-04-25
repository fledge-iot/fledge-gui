import { Component, OnInit, ViewChild } from '@angular/core';
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
  styleUrls: ['./control-tasks-list.component.css']
})
export class ControlTasksListComponent implements OnInit {
  controlScripts: any = [];
  script;
  @ViewChild('confirmationDialog') confirmationDialog: ConfirmationDialogComponent;
  controlTask;
  constructor(private controlService: ControlDispatcherService,
    private schedulesService: SchedulesService,
    private configurationService: ConfigurationService,
    private alertService: AlertService,
    private dialogService: DialogService,
    public sharedService: SharedService,
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
        console.log('script', this.controlScripts);
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

}
