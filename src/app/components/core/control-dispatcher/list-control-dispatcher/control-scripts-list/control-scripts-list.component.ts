import { Component, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { orderBy } from 'lodash';
import { AlertService, ProgressBarService, RolesService } from '../../../../../services';
import { ControlDispatcherService } from '../../../../../services/control-dispatcher.service';
import { ConfirmationDialogComponent } from '../../../../common/confirmation-dialog/confirmation-dialog.component';
import { DialogService } from '../../../../common/confirmation-dialog/dialog.service';
import { DocService } from '../../../../../services/doc.service';
import { ListAdditionalServicesComponent } from '../../../developer/additional-services/list-additional-services.component';
import { AddDispatcherServiceComponent } from './../../add-dispatcher-service/add-dispatcher-service.component';

@Component({
  selector: 'app-control-scripts-list',
  templateUrl: './control-scripts-list.component.html',
  styleUrls: ['./control-scripts-list.component.css']
})
export class ControlScriptsListComponent implements OnInit {
  controlScripts: any = [];
  @ViewChild('confirmationDialog') confirmationDialog: ConfirmationDialogComponent;
  @ViewChild(ListAdditionalServicesComponent, { static: true }) listAdditionalServicesComponent: ListAdditionalServicesComponent;
  @ViewChild(AddDispatcherServiceComponent, { static: true }) addDispatcherServiceComponent: AddDispatcherServiceComponent;

  script;
  private subscription: Subscription;
  isServiceAvailable = false;
  public reenableButton = new EventEmitter<boolean>(false);
  showConfigureModal: boolean = false;

  constructor(
    private controlService: ControlDispatcherService,
    private alertService: AlertService,
    private dialogService: DialogService,
    public docService: DocService,
    private ngProgress: ProgressBarService,
    public rolesService: RolesService) {
    this.subscription = this.controlService.triggerRefreshEvent.subscribe(tab => {
      if (tab === 'scripts') {
        this.getControlScripts();
      }
    })
  }

  ngOnInit(): void {
    this.getControlScripts();
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
    this.showConfigureModal = true;
    this.listAdditionalServicesComponent.showServices('dispatcher');
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
