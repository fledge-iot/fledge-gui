import { Injectable } from '@angular/core';
import { forkJoin, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { SchedulesService, ProgressBarService, AlertService, ServicesApiService, ResponseHandler } from '../../../../services';
import { FlowEditorService } from '../../../common/node-editor/flow-editor.service';
import { AvailableServices, Schedule } from '../../../../models';
import { takeUntil } from 'rxjs/operators';
import { SharedService } from '../../../../services/shared.service';

@Injectable({
    providedIn: 'root'
  })

export class AdditionalServicesUtils {
  destroy$: Subject<boolean> = new Subject<boolean>();

  servicesRegistry = [];
  installedServicePkgs = [];
  servicesSchedules = [];
  pollingScheduleID: string;
  availableServicePkgs = [];

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
        public flowEditorService: FlowEditorService,
        public sharedService: SharedService,
        private alertService: AlertService,
        private response: ResponseHandler){
    }


    public getAllServiceStatus(autoRefresh) {
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
            this.servicesRegistry = servicesRecord;
            this.sharedService.allServicesInfo.next(servicesRecord);
  
            if (autoRefresh) {
              this.syncServicesStatus(servicesRecord, this.installedServicePkgs);
            } else {
              this.checkSchedulesAndServices();
            }        
          },
          (error) => {
            console.log('service down ', error);
          });
    }

    syncServicesStatus(servicesRecord, installedServicePkgs) {
      servicesRecord.forEach(function (s) {
        if (s.name && installedServicePkgs.length > 0) {
          const service = installedServicePkgs.find(svc => svc.name === s.name);
          service.state = s.status;
        }
      });
    }

    public checkSchedulesAndServices() {
      this.ngProgress.start();
      this.schedulesService.getSchedules().
        subscribe((data: Schedule) => {      
          this.servicesSchedules = data['schedules'].filter((sch) => this.expectedServices.some(es => es.schedule_process == sch.processName));
          this.pollingScheduleID = data['schedules'].find(s => s.processName === 'manage')?.id;
          
          // If schedule of all services available then no need to make other API calls
          if (this.servicesSchedules?.length === this.expectedServices.length) {
            this.availableServicePkgs = [];
            let serviceTypes = [];
            this.expectedServices.forEach(function (s) {
              serviceTypes.push(s["process"]);
            });
            this.installedAndAddedServices(serviceTypes);
            this.ngProgress.done();         
          } else {
            // If schedule of all services are not available then check expected external services in /service API
            this.checkServices();
          }
        },
          (error) => {
            this.ngProgress.done();
            if (error.status === 0) {
              console.log('service down ', error);
            } else {
              this.alertService.error(error.statusText);
            }
          });
    }

    public installedAndAddedServices(services) {
      let svcs = services.filter(
        (s) => !["south", "north", "storage"].includes(s)
      );
      this.installedServicePkgs = this.expectedServices.filter(
        (s) => svcs.includes(s.process)
      );
      let replacement;
      let atIndex = -1;
      this.installedServicePkgs.forEach((installed, idx) => {
        replacement = structuredClone(installed);
        let foundService = this.servicesRegistry.find(s => s.type == installed.type);
        let foundSchedule = this.servicesSchedules.find(s => s.processName == installed["schedule_process"]);
        if (foundService === undefined) {
          if (foundSchedule !== undefined) {
            replacement.name = foundSchedule.name;
            replacement.added = true;
            replacement.state = foundSchedule.enabled === true ? 'running' : 'disabled';
            atIndex = idx;
          } else {
            replacement.name = '';
            replacement.added = false;
            replacement.state = 'installed';
            atIndex = idx;
          }
        } else {
          replacement.name = foundService.name;
          replacement.added = true;
          replacement.state = foundService.status;
          replacement.enabled = foundService.enabled;
          atIndex = idx;
        }
        // If service and schedule both are available then consider schedule state
        // (FYI; after enabling/disabling the service,  service API takes time to update the status)
        if (foundService && foundSchedule) {
          replacement.state = foundSchedule.enabled === true ? 'running' : 'disabled';
        }
        if (atIndex != -1) {
          this.installedServicePkgs[atIndex] = replacement;
        }
      });
      const addedServices = this.installedServicePkgs.filter((s) => s.added === true);
      const servicesToAdd = this.installedServicePkgs.filter((s) => s.added === false);
      this.installedServicePkgs = addedServices.sort((a, b) => a.type.localeCompare(b.type)).concat(servicesToAdd.sort((a, b) => a.type.localeCompare(b.type)));
      this.sharedService.installedServicePkgs.next(this.installedServicePkgs);
    }

    public checkServices() {
      const addedServices = this.servicesSchedules.filter(sch => this.servicesRegistry.some(({name}) => sch.name === name));
      
      // If we get expected services in the response of /service API then no need to make other (/installed, /available) API calls
      if (addedServices.length === this.expectedServices.length) {
        this.availableServicePkgs = [];
        let serviceTypes = [];
        this.expectedServices.forEach(function (s) {
          serviceTypes.push(s["process"]);
        });
        this.installedAndAddedServices(serviceTypes);
        this.ngProgress.done();
      } else {
        this.showServices();
      }
    }

    showServices() {
      let callsStack = {
        installed: this.servicesApiService.getInstalledServices(),
        available: this.servicesApiService.getAvailableServices()
      }
      this.ngProgress.start();
      forkJoin(callsStack)
        .pipe(
          map((response: any) => {
            const installed = <Array<string[]>>response.installed;
            const available = <Array<AvailableServices>>response.available;
            const result: any[] = [];
            result.push({
              ...{ 'installed': installed },
              ...{ 'available': available }
            });
            this.installedAndAddedServices(installed["services"]);
            this.getAvailableServices(available["services"]);
            // this.hideLoadingText();
            return result;
          })
        )
        .subscribe((result) => {
          result.forEach((r: any) => {
            this.ngProgress.done();
            // this.hideLoadingText();
            if (r.failed) {
              if (r.error.status === 0) {
                console.log('service down ', r.error);
              } else {
                this.alertService.error(r.error.statusText);
              }
            } else {
              this.response.handleResponseMessage(r.type);
            }
          });
        });
    }

    public getAvailableServices(services) {
      let svcs = services;
      const availableServices = this.expectedServices.filter(
        (s) => svcs.includes(s.package)
      );
      this.availableServicePkgs = availableServices.sort((a, b) => a.type.localeCompare(b.type));
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

    navToAdditionalServicePage(fromListPage, serviceProcessName) {
      let routeToNavigate = '/developer/options/additional-services';
      if (!fromListPage) {
        switch (serviceProcessName) {
          case 'notification':
            routeToNavigate = this.flowEditorService.getFlowEditorStatus() ? '/flow/editor/notifications': '/notification';
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
