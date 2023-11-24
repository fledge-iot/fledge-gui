import { Component, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertService, ProgressBarService, RolesService, ServicesApiService } from '../../../services';
import { SharedService } from '../../../services/shared.service';

import { ManageServiceModalComponent } from './manage-service-modal/manage-service-modal.component';

@Component({
  selector: 'app-manage-services',
  templateUrl: './list-manage-services.component.html',
  styleUrls: ['./list-manage-services.component.css']
})
export class ListManageServicesComponent implements OnInit {
  private viewPortSubscription: Subscription;
  viewPort: any = '';
  services = ['Notification Service', 'Dispatcher Service', 'Bucket Storage'];
  installedServices;

  isServiceAvailable: boolean;
  isServiceEnabled: boolean;
  serviceData = {};
  serviceName = '';
  
  @ViewChild(ManageServiceModalComponent, { static: true }) serviceModal: ManageServiceModalComponent;

  constructor(
    public sharedService: SharedService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    public servicesApiService: ServicesApiService,
    public rolesService: RolesService) { }

  async ngOnInit(): Promise<void> {
    this.viewPortSubscription = this.sharedService.viewport
      .subscribe(viewport => {
        this.viewPort = viewport;
      });
      await this.getInstalledServicesList();
  }

  addService() {
    console.log('addService');
  }

  public async getInstalledServicesList() {
    /** request start */
    this.ngProgress.start();
    await this.servicesApiService.getInstalledServices().
      then(data => {
        /** request done */
        this.ngProgress.done();
        this.installedServices = data['services'];
      })
      .catch(error => {
        /** request done */
        this.ngProgress.done();
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  /**
   * Open Settings modal
   */
   openServiceModal() {
    this.serviceData = {
      serviceAvailable: this.isServiceAvailable,
      serviceEnabled: this.isServiceEnabled,
      serviceName: this.serviceName
    };
    this.serviceModal.toggleModal(true);
  }

  public ngOnDestroy(): void {
    this.viewPortSubscription.unsubscribe();
  }
}
