import { Injectable } from '@angular/core';
import { SchedulesService, ProgressBarService, AlertService, ServicesApiService } from '../../../../services';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
  })

export class AdditionalServicesUtils {
   
    constructor(
        private router: Router,
        public schedulesService: SchedulesService,
        public servicesApiService: ServicesApiService,
        private ngProgress: ProgressBarService,
        private alertService: AlertService){
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

    disableService(serviceName, fromNavbar = false, serviceProcessName = null) {
      this.ngProgress.start();
      this.schedulesService.disableScheduleByName(serviceName).subscribe(
        (data) => {
          this.ngProgress.done();
          this.navToAdditionalServicePage(fromNavbar, serviceProcessName);
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

    navToAdditionalServicePage(fromNavbar, serviceProcessName) {
      if (fromNavbar) {
        let routeToNavigate = '/developer/options/additional-services';
        if (!this.isDeveloperFeatureOn()) {
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
      }
      return;
    }

    public isDeveloperFeatureOn(): boolean {
      const devFeature = JSON.parse(localStorage.getItem('DEV_FEATURES'));
      return devFeature ? devFeature : false;
    }
}
