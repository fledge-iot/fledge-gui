import { Component, OnInit, ViewChild, EventEmitter, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlertService, SharedService, ProgressBarService, RolesService } from '../../../../../services';
import { ConfirmationDialogComponent } from '../../../../common/confirmation-dialog/confirmation-dialog.component';
import { DialogService } from '../../../../common/confirmation-dialog/dialog.service';
import { orderBy } from 'lodash';
import { AclService } from '../../../../../services/acl.service';
import { DocService } from '../../../../../services/doc.service';
import { AdditionalServicesUtils } from '../../../developer/additional-services/additional-services-utils.service';

@Component({
  selector: 'app-acl-list',
  templateUrl: './acl-list.component.html',
  styleUrls: ['./acl-list.component.css']
})
export class AclListComponent implements OnInit, OnDestroy {
  @ViewChild('confirmationDialog') confirmationDialog: ConfirmationDialogComponent;

  controlAcls: any = [];

  acl;
  private subscription: Subscription;
  private serviceDetailsSubscription: Subscription;

  public reenableButton = new EventEmitter<boolean>(false);
  serviceInfo = { added: false, type: '', isEnabled: true, process: 'dispatcher', name: '', isInstalled: false };


  constructor(
    private aclService: AclService,
    private alertService: AlertService,
    private dialogService: DialogService,
    public docService: DocService,
    private router: Router,
    public rolesService: RolesService,
    public sharedService: SharedService,
    private additionalServicesUtils: AdditionalServicesUtils,
    private ngProgress: ProgressBarService) {
    this.additionalServicesUtils.getAllServiceStatus(false, 'dispatcher');
  }

  ngOnInit(): void {
    this.serviceDetailsSubscription = this.sharedService.installedServicePkgs.subscribe(service => {
      console.log('service', service);
      this.serviceInfo = service;

      // if (service) {
      //   const dispatcherServiceDetail = service.find(s => s.process == 'dispatcher');
      //   if (dispatcherServiceDetail) {
      //     this.serviceInfo.isEnabled = ["shutdown", "disabled", "installed"].includes(dispatcherServiceDetail?.state) ? false : true;
      //     this.serviceInfo.isInstalled = true;
      //     this.serviceInfo.added = dispatcherServiceDetail?.added;
      //     this.serviceInfo.name = dispatcherServiceDetail?.name;
      //   } else {
      //     this.serviceInfo.isEnabled = false;
      //     this.serviceInfo.isInstalled = false;
      //     this.serviceInfo.added = false;
      //     this.serviceInfo.name = '';
      //   }
      // }
    });
    this.getACLs();
  }

  refreshServiceInfo() {
    this.additionalServicesUtils.getAllServiceStatus(false, 'dispatcher');
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

  /**
   * Open Configure Service modal
   */
  openServiceConfigureModal() {
    this.router.navigate(['/developer/options/additional-services/config'], { state: { ...this.serviceInfo } });
  }

  goToLink(urlSlug: string) {
    this.docService.goToSetPointControlDocLink(urlSlug);
  }

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.serviceDetailsSubscription.unsubscribe();
  }
}

