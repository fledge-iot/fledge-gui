import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { sortBy } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  AlertService, AuthService, ConnectedServiceStatus, PingService,
  ProgressBarService, ServicesApiService, RolesService, SchedulesService
} from '../../../services';
import { SharedService } from '../../../services/shared.service';
import Utils from '../../../utils';
import { RestartModalComponent } from '../../common/restart-modal/restart-modal.component';
import { ShutdownModalComponent } from '../../common/shut-down/shutdown-modal.component';
import { SystemAlertComponent } from '../../core/system-alert/system-alert.component';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() toggle = new EventEmitter<string>();
  public timer: any = '';
  public pingData = {};
  public servicesRecord = [];
  public pingInfo = { isAlive: false, isAuth: false, isSafeMode: false, hostName: '', version: '', alertsCount: null };
  public shutDownData = {
    key: '',
    message: ''
  };
  public restartData = {
    key: '',
    message: ''
  };
  // Define a variable to use for showing/hiding the Login button
  isUserLoggedIn: boolean;
  userName: string;
  isAuthOptional = true;  // Default to true for authorized access
  uptime: any = '';
  viewPort: any = '';
  public showSpinner = false;
  isManualRefresh = false;
  servicesToShow = ['northbound', 'southbound', 'dispatcher', 'notification', 'management', 'bucketstorage'];
  schedulesData = [];

  @ViewChild(ShutdownModalComponent, { static: true }) child: ShutdownModalComponent;
  @ViewChild(RestartModalComponent, { static: true }) childRestart: RestartModalComponent;
  @ViewChild(SystemAlertComponent, { static: true }) systemAlertComponent: SystemAlertComponent;

  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private servicesApiService: ServicesApiService,
    private status: ConnectedServiceStatus,
    private alertService: AlertService,
    private ngProgress: ProgressBarService,
    private sharedService: SharedService,
    private authService: AuthService,
    private changeDetectorRef: ChangeDetectorRef,
    private ping: PingService,
    private router: Router,
    private schedulesService: SchedulesService,
    public rolesService: RolesService) {
    // Subscribe to automatically update
    // "isUserLoggedIn" whenever a change to the subject is made.
    this.sharedService.isUserLoggedIn
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.isUserLoggedIn = value.loggedIn;
        this.userName = value.userName;
        this.isAuthOptional = value.isAuth;
        this.pingService();
      });
  }

  ngOnInit() {
    this.pingService();
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
    this.onResize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event = null) {
    if (event === null) {
      if (window.screen.width < 768) {
        this.viewPort = 'mobile';
      } else if (768 <= window.screen.width && window.screen.width <= 1024) {
        this.viewPort = 'tablet';
      } else {
        this.viewPort = 'desktop';
      }
    } else {
      if (event.target.innerWidth < 768) {
        this.viewPort = 'mobile';
      } else if (768 <= event.target.innerWidth && event.target.innerWidth <= 1024) {
        this.viewPort = 'tablet';
      } else {
        this.viewPort = 'desktop';
      }
    }
    this.sharedService.viewport.next(this.viewPort);
  }

  ngAfterViewInit() {
    // get user token from session
    const token = sessionStorage.getItem('token');
    if (token != null && token.length > 0) {
      this.isUserLoggedIn = true;
    }
    if (sessionStorage.getItem('userName') != null) {
      this.userName = sessionStorage.getItem('userName');

      this.sharedService.isUserLoggedIn.next({
        'loggedIn': true,
        'userName': sessionStorage.getItem('userName'),
        'isAuthOptional': JSON.parse(sessionStorage.getItem('LOGIN_SKIPPED'))
      });
    }
    this.changeDetectorRef.detectChanges();
  }

  public getServiceStatus() {
    this.showLoadingSpinner();
    this.servicesApiService.getAllServices()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any) => {
          this.servicesRecord = [];
          const servicesData = data.services;
          const coreService = servicesData.filter((el => (el.type === 'Core')));
          const storageService = servicesData.filter((el => (el.type === 'Storage')));
          let southboundServices = servicesData.filter((el => (el.type === 'Southbound')));
          southboundServices = sortBy(southboundServices, function (obj) {
            return obj.name.toLowerCase();
          });
          let northboundServices = servicesData.filter((el => (el.type === 'Northbound')));
          northboundServices = sortBy(northboundServices, function (obj) {
            return obj.name.toLowerCase();
          });

          // NOTE: Open source additional services are notification and dispatcher only so there will be some extra API calls
          let expectedExternalServiceType = ['Notification', 'Management', 'Dispatcher', 'BucketStorage'];

          const additionalServices = servicesData.filter((s) => expectedExternalServiceType.includes(s.type));

          // If service is failed or unresponsive, check schedule as well
          const failedOrUnresponsiveServices = additionalServices.filter((s) => ['failed', 'unresponsive'].includes(s.status.toLowerCase()));
          if (failedOrUnresponsiveServices.length > 0) {
            this.getSchedules();
          }

          this.servicesRecord.push(coreService[0], storageService[0]);
          southboundServices.forEach(service => {
            this.servicesRecord.push(service);
          });
          northboundServices.forEach(service => {
            this.servicesRecord.push(service);
          });
          additionalServices.forEach(service => {
            this.servicesRecord.push(service);
          });

          this.hideLoadingSpinner();
        },
        (error) => {
          this.servicesRecord = [];
          this.hideLoadingSpinner();
          console.log('service down ', error);
        });
  }

  public pingService(pingManually = false) {
    if (pingManually === true) {
      this.ngProgress.start();
    }
    this.ping.pingService().then(data => {
      if (pingManually === true) {
        this.ngProgress.done();
      }
      this.status.changeMessage(true);
      this.pingData = data;
      const dayCount = Utils.secondsToDhms(data['uptime']).days;
      let dayLabel = 'day';
      if (dayCount > 1) {
        dayLabel = dayLabel + 's';
      }
      if (dayCount > 0) {
        this.uptime = dayCount + ' ' + dayLabel + ', ' + Utils.secondsToDhms(data['uptime']).roundOffTime;
      } else {
        this.uptime = Utils.secondsToDhms(data['uptime']).roundOffTime;
      }
      this.pingInfo = {
        isAlive: true, isAuth: false, isSafeMode: this.pingData['safeMode'], hostName: this.pingData['hostName'],
        version: this.pingData['version'], alertsCount: this.pingData['alerts']
      };
      if (data['authenticationOptional'] === true) {
        this.isUserLoggedIn = false;
        this.isAuthOptional = true;
        sessionStorage.removeItem('token');
        sessionStorage.setItem('isAdmin', JSON.stringify(false));
      }
      this.sharedService.isAdmin.next(JSON.parse(sessionStorage.getItem('isAdmin')));
      sessionStorage.setItem('LOGIN_SKIPPED', JSON.stringify(data['authenticationOptional']));
      this.sharedService.connectionInfo.next({ 'version': this.pingData['version'], 'isServiceUp': true });
    })
      .catch((error) => {
        this.pingData = [];
        this.status.changeMessage(false);
        if (pingManually === true) {
          this.ngProgress.done();
        }
        // If response code is non zero and not undefined, set isAlive and isAuth to true,
        // else set service to down and pingInfo accordingly
        if (error && error.status && !(error.status === 0 || error.status === 404)) {
          this.pingInfo.isAlive = true;
          this.pingInfo.isAuth = true;
        } else {
          this.sharedService.connectionInfo.next({ version: '', isServiceUp: false });
          this.pingInfo = { isAlive: false, isAuth: false, isSafeMode: false, hostName: '', version: '', alertsCount: this.pingData['alerts'] };
        }
      });
  }

  showProfile() {
    this.router.navigate(['/user/profile']);
  }

  public toggleDropdown() {
    const userDropdown = <HTMLDivElement>document.getElementById('dropdown-box');
    const classes = userDropdown.className.split(' ');
    for (const cls of classes) {
      if (cls === 'is-active') {
        userDropdown.classList.remove('is-active');
        return;
      }
    }
    userDropdown.classList.add('is-active');
  }

  public toggleInfoDropdown() {
    const fledgeDropdown = <HTMLDivElement>document.getElementById('fledge-info');
    const classes = fledgeDropdown.className.split(' ');
    for (const cls of classes) {
      if (cls === 'is-active') {
        fledgeDropdown.classList.remove('is-active');
        return;
      }
    }
    fledgeDropdown.classList.add('is-active');
  }

  openModal() {
    this.shutDownData = {
      key: 'shutdown',
      message: 'Do you really want to shut down the Fledge?'
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }

  openRestartModal() {
    this.restartData = {
      key: 'restart',
      message: 'Do you really want to restart the Fledge?'
    };
    // call childRestart component method to toggle modal
    this.childRestart.toggleModal(true);
  }

  restart() {
    /** request started */
    this.ngProgress.start();
    this.ping.restart()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.pingData = [];
          this.alertService.success(data['message']);
        },
        (error) => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  shutdown() {
    /** request started */
    this.ngProgress.start();
    this.ping.shutdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.pingData = [];
          this.alertService.success(data['message']);
        },
        (error) => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public start(pingInterval) {
    this.stop();
    this.timer = setInterval(function () {
      this.pingService();
    }.bind(this), pingInterval);
  }

  public stop() {
    clearInterval(this.timer);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  toggleClick() {
    this.toggle.next('toggleSidebar');
  }

  applyPingStatusCustomCss(ping_info) {
    if (this.pingData) {
      if (this.pingData['health'] === 'green') {
        return 'has-text-success';
      }
      if (this.pingData['health'] === 'amber') {
        return 'has-text-warning';
      }
      if (this.pingData['health'] === 'red' || !ping_info.isAlive) {
        return 'has-text-danger';
      }
    } else {
      return 'has-text-danger';
    }
  }

  applyServiceStatusCustomCss(serviceStatus: string) {
    if (serviceStatus.toLowerCase() === 'running') {
      return 'has-text-success';
    }
    if (serviceStatus.toLowerCase() === 'unresponsive') {
      return 'has-text-warning';
    }
    if (serviceStatus.toLowerCase() === 'shutdown') {
      return 'has-text-grey-lighter';
    }
    if (serviceStatus.toLowerCase() === 'failed') {
      return 'has-text-danger';
    }
  }

  /**
     *  Signout the current user
     */
  logout() {
    this.ngProgress.start();
    this.authService.logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.clearUserSession();
          this.ngProgress.done();
          this.alertService.success('You have been successfully logged out!');
        },
        error => {
          this.ngProgress.done();
          this.clearUserSession();
          if (error.status === 0) {
            console.log('service down', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  clearUserSession() {
    sessionStorage.clear();
    this.servicesRecord = [];
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  navToSyslogs(service) {
    this.router.navigate(['logs/syslog'], { queryParams: { source: service.name } });
  }

  public getSchedules(serviceInfo = null): void {
    this.ngProgress.start();
    this.schedulesService.getSchedules().
      subscribe(
        (data: any) => {
          this.ngProgress.done();
          this.schedulesData = data.schedules;
          if (serviceInfo) {
            const pollingScheduleID = data.schedules.find(s => s.processName === 'manage')?.id;
            serviceInfo['pollingScheduleID'] = pollingScheduleID;
            this.router.navigate(['/developer/options/additional-services/config'], { state: { ...serviceInfo } });
          }
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public isDeveloperFeatureOn(): boolean {
    const devFeature = JSON.parse(localStorage.getItem('DEV_FEATURES'));
    return devFeature ? devFeature : false;
  }

  navToServiceConfiguration(service) {
    let isServiceEnabled = ["running", "true"].includes(service.status);
    if (['failed', 'unresponsive'].includes(service.status.toLowerCase())) {
      isServiceEnabled = this.schedulesData.find(sch => sch.name === service.name)?.enabled;
    }

    let serviceInfo = {
      name: service.name,
      isEnabled: isServiceEnabled,
      added: true,
      isInstalled: true
    }
    switch (service.type) {
      case 'Northbound':
        this.router.navigate(['north', service.name, 'details']);
        break;
      case 'Southbound':
        this.router.navigate(['south', service.name, 'details']);
        break;
      case 'BucketStorage':
        serviceInfo['process'] = 'bucket';
        serviceInfo['type'] = 'BucketStorage';
        serviceInfo['package'] = 'fledge-service-bucket';
        this.router.navigate(['/developer/options/additional-services/config'], { state: { ...serviceInfo } });
        break;
      case 'Management':
        serviceInfo['process'] = 'management';
        serviceInfo['type'] = 'Management';
        serviceInfo['package'] = 'fledge-service-management';
        this.getSchedules(serviceInfo);
        break;
      case 'Dispatcher':
        serviceInfo['process'] = 'dispatcher';
        serviceInfo['type'] = 'Dispatcher';
        serviceInfo['package'] = 'fledge-service-dispatcher';
        this.router.navigate(['/developer/options/additional-services/config'], { state: { ...serviceInfo } });
        break;
      case 'Notification':
        serviceInfo['process'] = 'notification';
        serviceInfo['type'] = 'Notification';
        serviceInfo['package'] = 'fledge-service-notification';
        this.router.navigate(['/developer/options/additional-services/config'], { state: { ...serviceInfo } });
        break;
      default:
        break;
    }
  }
}
