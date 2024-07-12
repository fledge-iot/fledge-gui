import { Component, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { orderBy } from 'lodash';
import { map } from 'rxjs/operators';
import { AlertService, ProgressBarService, RolesService, SharedService } from '../../../../../services';
import { ControlDispatcherService } from '../../../../../services/control-dispatcher.service';
import { ConfirmationDialogComponent } from '../../../../common/confirmation-dialog/confirmation-dialog.component';
import { DialogService } from '../../../../common/confirmation-dialog/dialog.service';
import { DocService } from '../../../../../services/doc.service';
import { AdditionalServicesUtils } from '../../../developer/additional-services/additional-services-utils.service';

@Component({
  selector: 'app-control-scripts-list',
  templateUrl: './control-scripts-list.component.html',
  styleUrls: ['./control-scripts-list.component.css']
})
export class ControlScriptsListComponent implements OnInit {
  controlScripts: any = [];
  @ViewChild('confirmationDialog') confirmationDialog: ConfirmationDialogComponent;

  script;
  private subscription: Subscription;
  private serviceDetailsSubscription: Subscription;
  private paramsSubscription: Subscription;
  public reenableButton = new EventEmitter<boolean>(false);

  serviceInfo = { added: false, isEnabled: true, name: '', isInstalled: false };

  constructor(
    private controlService: ControlDispatcherService,
    private alertService: AlertService,
    private dialogService: DialogService,
    public docService: DocService,
    private ngProgress: ProgressBarService,
    private router: Router,
    public activatedRoute: ActivatedRoute,
    public sharedService: SharedService,
    private additionalServicesUtils: AdditionalServicesUtils,
    public rolesService: RolesService) {
    // If we are redirecting back after enabling/disabling/adding the service then no need to make all calls again
    this.paramsSubscription = this.activatedRoute.paramMap
      .pipe(map(() => window.history.state)).subscribe((data: any) => {
        if (!data?.shouldSkipCalls) {
          this.additionalServicesUtils.getAllServiceStatus(false, 'dispatcher');
        }
      })
    // Issue may cause by refreshing the page because of old state data, so need to update history state
    history.replaceState({ shouldSkipCalls: false }, '');

    this.subscription = this.controlService.triggerRefreshEvent.subscribe(tab => {
      if (tab === 'scripts') {
        this.getControlScripts();
      }
    })
  }

  ngOnInit(): void {
    this.serviceDetailsSubscription = this.sharedService.installedServicePkgs.subscribe(service => {
      if (service.installed) {
        this.serviceInfo = service.installed;
      }
    });
    this.getControlScripts();
  }

  refreshServiceInfo() {
    this.additionalServicesUtils.getAllServiceStatus(false, 'dispatcher');
  }

  goToLink(urlSlug: string) {
    this.docService.goToSetPointControlDocLink(urlSlug);
  }

  getControlScripts() {
    /** request started */
    this.ngProgress.start();
    this.controlService.fetchControlServiceScripts()
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.controlScripts = orderBy(data.scripts, 'name');
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

  setScript(script: any) {
    this.script = script.name;
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  deleteScript(script) {
    /** request started */
    this.ngProgress.start();
    this.controlService.deleteScript(script)
      .subscribe((data: any) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertService.success(data.message);
        // close modal
        this.closeModal('confirmation-dialog');
        this.getControlScripts();
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

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.serviceDetailsSubscription.unsubscribe();
    this.paramsSubscription.unsubscribe();
  }
}
