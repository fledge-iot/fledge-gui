import { Component, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertService, SharedService, ProgressBarService } from '../../../../../services';
import { ControlDispatcherService } from '../../../../../services/control-dispatcher.service';
import { ConfirmationDialogComponent } from '../../../../common/confirmation-dialog/confirmation-dialog.component';
import { DialogService } from '../../../../common/confirmation-dialog/dialog.service';
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
    public sharedService: SharedService,
    private ngProgress: ProgressBarService) {
    this.subscription = this.controlService.triggerRefreshEvent.subscribe(tab => {
      if (tab === 'acls') {
        this.showACLs();
      }
    })
  }

  ngOnInit(): void {
    this.showACLs();
  }

  showACLs() {
    /** request started */
    this.ngProgress.start();
    this.controlService.fetchAllACL()
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.controlAcls = orderBy(data.acls, 'name')
        // Uncomment below code for testing of usese on list
        // this.controlAcls = this.controlAcls.map((item) => {
        //   item['users'] = [
        //     {
        //       "service": "Substation 11"
        //     },
        //     {
        //       "script": "A#1"
        //     },
        //     {
        //       "service": "Substation 110"
        //     },
        //     {
        //       "script": "A#2"
        //     },
        //     {
        //       "script": "A#21"
        //     }
        //   ]
        //   return item;
        // });

        // make users array for {service, script} object to make a tabel in html view
        this.controlAcls.forEach(acl => {
          if (acl.users) {
            const userServices = acl.users.map(u => ({ service: u.service })).filter(s => s.service);
            const userScripts = acl.users.map(u => ({ script: u.script })).filter(s => s.script);
            const users = [userServices, userScripts];
            acl.users = Array.from({
              length: acl.users.length
            }, (_, index) => Object.assign({}, ...users.map(({ [index]: obj }) => obj)));
            // remove empty {} objects from array
            acl.users = acl.users.filter(value => Object.keys(value).length !== 0);
          }
        });
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
        // close modal
        this.closeModal('confirmation-dialog');
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

