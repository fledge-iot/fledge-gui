import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { SchedulesService, ProgressBarService, AlertService, ServicesApiService } from '../../../../services';
import { SharedService } from '../../../../services/shared.service';

@Injectable({
  providedIn: 'root'
})

export class AdditionalServicesUtils {
  destroy$: Subject<boolean> = new Subject<boolean>();

  expectedServices = [
    {
      "package": "fledge-service-notification",
      "process": "notification",
      "schedule_process": "notification_c",
      "type": "Notification",
      "name": "",
      "state": "",
      "added": false
    },
    {
      "package": "fledge-service-bucket",
      "process": "bucket",
      "schedule_process": "bucket_storage_c",
      "type": "BucketStorage",
      "name": "",
      "state": "",
      "added": false
    },
    {
      "package": "fledge-service-management",
      "process": "management",
      "schedule_process": "management",
      "type": "Management",
      "name": "",
      "state": "",
      "added": false
    },
    {
      "package": "fledge-service-dispatcher",
      "process": "dispatcher",
      "schedule_process": "dispatcher_c",
      "type": "Dispatcher",
      "name": "",
      "state": "",
      "added": false
    }
  ];

  constructor(
    private router: Router,
    public schedulesService: SchedulesService,
    public servicesApiService: ServicesApiService,
    private ngProgress: ProgressBarService,
    private sharedService: SharedService,
    private alertService: AlertService) {
  }

  enableService(serviceName) {
    this.ngProgress.start();
    this.schedulesService.enableScheduleByName(serviceName).subscribe(
      (data) => {
        this.ngProgress.done();
        this.alertService.success(data["message"], true);
      },
      (error) => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log("service down ", error);
        } else {
          this.alertService.error(error.statusText);
        }
      }
    );
  }

  disableService(serviceName) {
    this.ngProgress.start();
    this.schedulesService.disableScheduleByName(serviceName).subscribe(
      (data) => {
        this.ngProgress.done();
        this.alertService.success(data["message"], true);
      },
      (error) => {
        this.ngProgress.done();
        if (error.status === 0) {
          console.log("service down ", error);
        } else {
          this.alertService.error(error.statusText);
        }
      }
    );
  }

  // Called from ml model to access additional service modal
  navToAdditinalServiceModal(service: any) {
    this.router.navigate(['/developer/options/additional-services/config'], { state: { ...service } });
  }

  navToAdditionalServicePage(fromListPage, serviceProcessName) {
    let routeToNavigate = '/developer/options/additional-services';
    if (!fromListPage) {
      switch (serviceProcessName) {
        case 'notification':
          routeToNavigate = '/notification';
          break;
        case 'bucket':
          routeToNavigate = '/mlmodels';
          break;
        case 'dispatcher':
          routeToNavigate = '/control-dispatcher/acl';
          break;
        default:
          routeToNavigate = '';
          break;
      }
    }
    this.router.navigate([routeToNavigate]);
    return;
  }

  public isDeveloperFeatureOn(): boolean {
    const devFeature = JSON.parse(localStorage.getItem('DEV_FEATURES'));
    return devFeature ? devFeature : false;
  }
}
