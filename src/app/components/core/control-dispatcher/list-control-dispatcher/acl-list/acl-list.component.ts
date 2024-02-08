import { Component, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertService, SharedService, ProgressBarService, RolesService } from '../../../../../services';
import { ConfirmationDialogComponent } from '../../../../common/confirmation-dialog/confirmation-dialog.component';
import { DialogService } from '../../../../common/confirmation-dialog/dialog.service';
import { orderBy } from 'lodash';
import { AclService } from '../../../../../services/acl.service';
import { DocService } from '../../../../../services/doc.service';
import { AdditionalServiceModalComponent } from '../../../developer/additional-services/additional-service-modal/additional-service-modal.component';
import { AddDispatcherServiceComponent } from './../../add-dispatcher-service/add-dispatcher-service.component';

@Component({
  selector: 'app-acl-list',
  templateUrl: './acl-list.component.html',
  styleUrls: ['./acl-list.component.css']
})
export class AclListComponent implements OnInit {
  @ViewChild('confirmationDialog') confirmationDialog: ConfirmationDialogComponent;
  @ViewChild(AdditionalServiceModalComponent, { static: true }) additionalServiceModalComponent: AdditionalServiceModalComponent;
  @ViewChild(AddDispatcherServiceComponent, { static: true }) addDispatcherServiceComponent: AddDispatcherServiceComponent;

  controlAcls: any = [];
  
  acl;
  isServiceAvailable = false;
  private subscription: Subscription;

  public reenableButton = new EventEmitter<boolean>(false);
  showConfigureModal: boolean = false;
  serviceInfo;

  constructor(
    private aclService: AclService,
    private alertService: AlertService,
    private dialogService: DialogService,
    public docService: DocService,
    public rolesService: RolesService,
    public sharedService: SharedService,
    private ngProgress: ProgressBarService) {
  }

  ngOnInit(): void {
    this.getACLs();
  }


  getACLs() {
    /** request started */
    this.ngProgress.start();
    this.aclService.fetchAllACL()
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
    this.aclService.deleteACL(acl)
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertService.success(data.message);
        // close modal
        this.closeModal('confirmation-dialog');
        this.getACLs();
      }, error => {
        /** request completed */
        this.ngProgress.done();
        this.reenableButton.emit(false);
        // close modal
        this.closeModal('confirmation-dialog');
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  getServiceDetail(event) {
    this.showConfigureModal = event.isOpen;
    delete event.isOpen;
    this.serviceInfo = event;
    if (this.showConfigureModal) {
      this.openServiceConfigureModal();
    }
  }

  /**
   * Open Configure Service modal
   */
  openServiceConfigureModal() {
    this.additionalServiceModalComponent.toggleModal(true);
    this.additionalServiceModalComponent.getServiceInfo(this.serviceInfo, null, 'dispatcher');
  }

  goToLink(urlSlug: string) {
    this.docService.goToSetPointControlDocLink(urlSlug);
  }

  onNotify(event) {
    if (event?.isCancelEvent) {
      return;
    }
    this.addDispatcherServiceComponent.getInstalledServicesList();
  }

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}

