import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { sortBy } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { SchedulesService, ProgressBarService, AlertService, ServicesApiService } from '../../../../services';
import { SharedService } from '../../../../services/shared.service';

@Injectable({
    providedIn: 'root'
  })

export class AdditionalServicesUtils {
    destroy$: Subject<boolean> = new Subject<boolean>();

    constructor(
        private router: Router,
        public schedulesService: SchedulesService,
        public servicesApiService: ServicesApiService,
        private ngProgress: ProgressBarService,
        private sharedService: SharedService,
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

    public getAllServiceStatus() {
      this.servicesApiService.getAllServices()
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (data: any) => {
            const servicesRecord = [];
            const servicesData = data.services;
            const notificationService = servicesData.filter((el => (el.type === 'Notification')));
            const managementService = servicesData.filter((el => (el.type === 'Management')));
            const dispatcherService = servicesData.filter((el => (el.type === 'Dispatcher')));
            const bucketStorageService = servicesData.filter((el => (el.type === 'BucketStorage')));
  
            if (notificationService.length) {
              servicesRecord.push(notificationService[0]);
            }
  
            if (managementService.length) {
              servicesRecord.push(managementService[0]);
            }
  
            if (dispatcherService.length) {
              servicesRecord.push(dispatcherService[0]);
            }
  
            if (bucketStorageService.length) {
              servicesRecord.push(bucketStorageService[0]);
            }
            this.sharedService.allServicesInfo.next(servicesRecord);
          },
          (error) => {
            console.log('service down ', error);
          });
    }
}
