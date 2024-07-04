import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { SchedulesService, ProgressBarService, AlertService, ServicesApiService } from '../../../../services';
import { FlowEditorService } from '../../../common/node-editor/flow-editor.service';
import { AvailableServices, Schedule } from '../../../../models';
import { takeUntil } from 'rxjs/operators';
import { SharedService } from '../../../../services/shared.service';

@Injectable({
  providedIn: 'root'
})

export class AdditionalServicesUtils {
  destroy$: Subject<boolean> = new Subject<boolean>();

  // to emit available serivces packages to use in the additional services list page
  private servicesPkgs = new BehaviorSubject<any>(false);
  availableServices = this.servicesPkgs.asObservable();

  servicesRegistry = [];
  installedServicePkgs = [];
  servicesSchedules = [];
  pollingScheduleID: string;
  availableServicePkgs = [];
  expectedServices = [];

  allExpectedServices = [
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
    private alertService: AlertService) {
  }
  public getAllServiceStatus(autoRefresh: boolean, from: string) {
    if (from !== 'additional-services') {
      this.expectedServices = this.allExpectedServices.filter((s => (s.process === from)));
    } else {
      this.expectedServices = this.allExpectedServices;
    }
    this.servicesApiService.getAllServices()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any) => {
          this.servicesRegistry = data.services.filter((el) => ['Notification', 'Management', 'Dispatcher', 'BucketStorage'].includes(el.type))
          this.sharedService.allServicesInfo.next(this.servicesRegistry);
          if (autoRefresh) {
            this.syncServicesStatus(this.servicesRegistry, this.installedServicePkgs);
          } else {
            const matchedServices = this.servicesRegistry.filter((svc) => this.expectedServices.some(es => es.type == svc.type));
            if (matchedServices?.length === this.expectedServices.length) {
              this.availableServicePkgs = [];
              let serviceTypes = [];
              this.expectedServices.forEach(function (s) {
                serviceTypes.push(s["process"]);
              });
              this.showInstalledAndAddedServices(serviceTypes);
              this.ngProgress.done();
            } else {
              this.checkSchedules(from);
            }
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

  public checkSchedules(from: string) {
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
          this.showInstalledAndAddedServices(serviceTypes);
          this.ngProgress.done();
        } else {
          // If schedule of all services are not available then check expected external services in /installed API
          this.checkInstalledServices(from);
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

  public showInstalledAndAddedServices(services) {
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
    console.log('this.installedServicePkgs', this.installedServicePkgs);
    const service = { name: '', added: false, isEnabled: false, isInstalled: false };
    if (this.installedServicePkgs.length > 0) {
      const serviceDetail = this.installedServicePkgs.find(s => ['bucket', 'dispatcher', 'notification', 'management'].includes(s.process));
      console.log('serviceDetail', serviceDetail);
      if (serviceDetail) {
        service.isEnabled = ["shutdown", "disabled", "installed"].includes(serviceDetail.state) ? false : true;
        service.isInstalled = true;
        service.added = serviceDetail?.added;
        service.name = serviceDetail?.name;
      }
    }
    console.log(service);
    this.sharedService.installedServicePkgs.next(service);
  }

  public checkInstalledServices(from: string) {
    this.servicesApiService.getInstalledServices().subscribe((installedSvcs) => {
      const installedServices = installedSvcs['services'].filter((svc) => this.expectedServices.some(es => es.process == svc));
      // If we get expected services in the response of /installed API then no need to make extra (/available) API call
      if (installedServices.length === this.expectedServices.length) {
        this.availableServicePkgs = [];
        let serviceTypes = [];
        this.expectedServices.forEach(function (s) {
          serviceTypes.push(s["process"]);
        });
        this.showInstalledAndAddedServices(serviceTypes);
        this.ngProgress.done();
      } else {
        this.showInstalledAndAddedServices(installedServices);
        if (from == 'additional-services') {
          this.getAvailableServices();
        }
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

  public getAvailableServices() {
    this.servicesApiService.getAvailableServices().subscribe((availableSvcs: AvailableServices) => {
      let svcs = availableSvcs['services'];
      const availableServices = this.expectedServices.filter(
        (s) => svcs.includes(s.package)
      );
      this.availableServicePkgs = availableServices.sort((a, b) => a.type.localeCompare(b.type));
      this.servicesPkgs.next(this.availableServicePkgs);
      this.ngProgress.done();
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
          routeToNavigate = this.flowEditorService.getFlowEditorStatus() ? '/flow/editor/notifications' : '/notification';
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
