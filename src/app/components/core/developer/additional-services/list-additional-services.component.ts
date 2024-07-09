import { Component, OnInit, EventEmitter, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { timer, of, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { concatMap, delayWhen, retryWhen, take, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AlertService, ProgressBarService, RolesService, ServicesApiService, SchedulesService, PingService } from '../../../../services';
import { SharedService } from '../../../../services/shared.service';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { AdditionalServicesContextMenuComponent } from './additional-services-context-menu/additional-services-context-menu.component';
import { AdditionalServicesUtils } from './additional-services-utils.service';

@Component({
  selector: "app-list-additional-services",
  templateUrl: "./list-additional-services.component.html",
  styleUrls: ["./list-additional-services.component.css"],
})
export class ListAdditionalServicesComponent implements OnInit, OnDestroy {
  installedServicePkgs = [];
  availableServicePkgs = [];

  servicesRegistry = [];
  servicesSchedules = [];

  showLoading = false;
  viewPortSubscription: Subscription;
  viewPort: any = '';
  pollingScheduleID: string;
  isManualRefresh = false;

  service;
  public timer: any = '';

  private serviceDetailsSubscription: Subscription;

  public reenableButton = new EventEmitter<boolean>(false);
  @ViewChildren(AdditionalServicesContextMenuComponent) contextMenus: QueryList<AdditionalServicesContextMenuComponent>;

  destroy$: Subject<boolean> = new Subject<boolean>();
  constructor(
    public sharedService: SharedService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    private dialogService: DialogService,
    public servicesApiService: ServicesApiService,
    public rolesService: RolesService,
    public schedulesService: SchedulesService,
    private ping: PingService,
    private router: Router,
    public additionalServicesUtils: AdditionalServicesUtils
  ) { }

  ngOnInit() {
    this.ping.pingIntervalChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((pingTime: number) => {
        if (pingTime === -1) {
          this.isManualRefresh = true;
          this.stop();
        } else {
          this.isManualRefresh = false;
          this.start(pingTime);
        }
      });
    this.viewPortSubscription = this.sharedService.viewport.subscribe(viewport => {
      this.viewPort = viewport;
    });

    this.showLoadingText();
    this.additionalServicesUtils.getAllServiceStatus(false, 'additional-services');

    this.serviceDetailsSubscription = this.sharedService.installedServicePkgs.subscribe(service => {
      // check "service.installed" is an array or not (FYI; it is an object in case of separate service pages)
      if (service.installed instanceof Array && service.availableToInstall) {
        this.installedServicePkgs = service.installed;
        this.availableServicePkgs = service.availableToInstall;
        this.hideLoadingText();
      }
    });
  }

  public start(pingInterval) {
    this.stop();
    this.timer = setInterval(function () {
      this.additionalServicesUtils.getAllServiceStatus(true, 'additional-services');
    }.bind(this), pingInterval);
  }

  public stop() {
    clearInterval(this.timer);
  }

  openServiceModal(service) {
    if (!service) {
      this.alertService.warning('No package available to install');
      return;
    }
    let availableService = this.availableServicePkgs.find(s => s.process === service.process);
    if (availableService) {
      service.isInstalled = false;
    } else {
      service.isInstalled = true;
    }
    service.isEnabled = ["shutdown", "disabled", "installed", ""].includes(service.state) ? false : true;
    service['pollingScheduleID'] = this.pollingScheduleID;
    service['fromListPage'] = true;

    this.setService(service);
    this.router.navigate(['/developer/options/additional-services/config'], { state: { ...service } });
  }

  getData(handleEvent = true) {
    if (handleEvent) {
      this.additionalServicesUtils.getAllServiceStatus(false, 'additional-services');
    }
  }

  deleteService(serviceName: string) {
    this.ngProgress.start();
    this.servicesApiService.deleteService(serviceName).subscribe(
      (data: any) => {
        this.ngProgress.done();
        this.reenableButton.emit(false);
        this.alertService.success(data["result"], true);
        this.closeModal('delete-confirmation-dialog');
        this.getData();
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

  applyClass(serviceStatus: string) {
    if (serviceStatus.toLowerCase() === "running") {
      return "is-success";
    }
    if (serviceStatus.toLowerCase() === "shutdown") {
      return "is-light";
    }
    if (serviceStatus.toLowerCase() === "unresponsive") {
      return "is-warning";
    }
    if (serviceStatus.toLowerCase() === "failed") {
      return "is-danger";
    }
    if (serviceStatus.toLowerCase() === "enabled" || serviceStatus.toLowerCase() === "installed") {
      return "is-info";
    }
  }

  public showLoadingText() {
    this.showLoading = true;
  }

  public hideLoadingText() {
    this.showLoading = false;
  }

  openModal(id: string) {
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.dialogService.close(id);
  }

  stateUpdate() {
    if (["shutdown", "disabled"].includes(this.service.state)) {
      this.additionalServicesUtils.enableService(this.service.name);
      // enabling service takes time to get the updated state from API
      this.getUpdatedState('running');
    } else {
      this.additionalServicesUtils.disableService(this.service.name);
      this.getUpdatedState('shutdown');
    }
  }

  getUpdatedState(status) {
    let i = 1;
    const initialDelay = 1500;
    const expectedStatus = status;
    this.servicesApiService.getServiceByType(this.service.type)
      .pipe(
        take(1),
        // checking the response object for service.
        // if service.status !== 'running'/'shutdown' then
        // throw an error to re-fetch:
        tap((response: any) => {
          if (response['services'][0].status !== expectedStatus) {
            i++;
            throw response;
          }
        }),
        retryWhen(result =>
          result.pipe(
            // only if a server returned an error, stop trying and pass the error down
            tap(serviceStatus => {
              if (serviceStatus.error) {
                this.ngProgress.done();
                this.afterStateUpdate();
                throw serviceStatus.error;
              }
            }),
            delayWhen(() => {
              const delay = i * initialDelay;
              console.log(new Date().toLocaleString(), `retrying after ${delay} msec...`);
              return timer(delay);
            }), // delay between api calls
            // Set the number of attempts.
            take(3),
            // Throw error after exceed number of attempts
            concatMap(o => {
              if (i > 3) {
                this.ngProgress.done();
                this.afterStateUpdate();
                return;
              }
              return of(o);
            }),
          ))
      ).subscribe(() => {
        this.ngProgress.done();
        this.afterStateUpdate();
      });
  }

  afterStateUpdate() {
    this.reenableButton.emit(false);
    this.closeModal('confirmation-dialog');
    this.additionalServicesUtils.getAllServiceStatus(false, 'additional-services');
  }

  setService(service) {
    this.service = service;
  }

  public ngOnDestroy(): void {
    clearInterval(this.timer);
    this.viewPortSubscription.unsubscribe();
    this.serviceDetailsSubscription.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
