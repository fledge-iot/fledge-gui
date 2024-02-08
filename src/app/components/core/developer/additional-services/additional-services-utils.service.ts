import { Injectable, EventEmitter } from '@angular/core';
import { SchedulesService, ProgressBarService, AlertService, ServicesApiService } from '../../../../services';

@Injectable({
    providedIn: 'root'
  })

export class AdditionalServicesUtils {
    public reenableButton = new EventEmitter<boolean>(false);

    constructor(
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
            this.reenableButton.emit(false);
            this.alertService.success(data["message"], true);
          },
          (error) => {
            this.ngProgress.done();
            this.reenableButton.emit(false);
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
            this.reenableButton.emit(false);
            this.alertService.success(data["message"], true);
          },
          (error) => {
            this.ngProgress.done();
            this.reenableButton.emit(false);
            if (error.status === 0) {
              console.log("service down ", error);
            } else {
              this.alertService.error(error.statusText);
            }
          }
        );
    }
    
    deleteService(serviceName) {
        this.ngProgress.start();
        this.servicesApiService.deleteService(serviceName).subscribe(
            (data: any) => {
            this.ngProgress.done();
            this.reenableButton.emit(false);
            this.alertService.success(data["result"], true);
            },
            (error) => {
            this.ngProgress.done();
            this.reenableButton.emit(false);
            if (error.status === 0) {
                console.log("service down ", error);
            } else {
                this.alertService.error(error.statusText);
            }
            }
        );
    }
}
