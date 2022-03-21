import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertService, SharedService, ProgressBarService } from '../../../../../services';
import { ControlDispatcherService } from '../../../../../services/control-dispatcher.service';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { DialogService } from '../../confirmation-dialog/dialog.service';

@Component({
  selector: 'app-control-tasks-list',
  templateUrl: './control-tasks-list.component.html',
  styleUrls: ['./control-tasks-list.component.css']
})
export class ControlTasksListComponent implements OnInit {
  controlTasks: any = [];
  @ViewChild('confirmationDialog') confirmationDialog: ConfirmationDialogComponent;
  controlTask;
  constructor(private controlService: ControlDispatcherService,
    private alertService: AlertService,
    private dialogService: DialogService,
    public sharedService: SharedService,
    private ngProgress: ProgressBarService) { }

  ngOnInit(): void {
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  deleteTask(task) {
    console.log('Not implemented yet', task);

  }


}
