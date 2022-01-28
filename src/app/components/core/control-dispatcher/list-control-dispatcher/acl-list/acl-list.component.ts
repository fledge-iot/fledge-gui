import { Component, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertService, SharedService, ProgressBarService } from '../../../../../services';
import { ControlDispatcherService } from '../../../../../services/control-dispatcher.service';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { DialogService } from '../../confirmation-dialog/dialog.service';
import { orderBy } from 'lodash';

@Component({
  selector: 'app-acl-list',
  templateUrl: './acl-list.component.html',
  styleUrls: ['./acl-list.component.css']
})
export class AclListComponent implements OnInit {
  controlAcls: any = [];
  @ViewChild('confirmationDialog') confirmationDialog: ConfirmationDialogComponent;
  acl;
  private subscription: Subscription;
  constructor(
    private controlService: ControlDispatcherService,
    private alertService: AlertService,
    private dialogService: DialogService,
    private sharedService: SharedService,
    private ngProgress: ProgressBarService) { }

  ngOnInit(): void {
    this.showACLs();
  }

  showACLs() {
    /** request started */
    this.ngProgress.start();
    this.controlService.fetchAllACL()
      .subscribe((data: any) => {
        console.log('data acl', data);

        this.ngProgress.done();
        this.controlAcls = orderBy(data.acls, 'name');
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

  setACL(acl: any) {
    this.acl = acl.name;
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  deleteAcl(acl) {
    /** request started */
    this.ngProgress.start();
    this.controlService.deleteACL(acl)
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.alertService.success(data.message);
        // close modal
        this.closeModal('confirmation-dialog');
        this.showACLs();
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

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}

