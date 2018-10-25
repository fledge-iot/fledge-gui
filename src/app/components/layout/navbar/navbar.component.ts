import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, AuthService, ConnectedServiceStatus, PingService, ServicesHealthService } from '../../../services';
import { SharedService } from '../../../services/shared.service';
import Utils from '../../../utils';
import { RestartModalComponent } from '../../common/restart-modal/restart-modal.component';
import { ShutdownModalComponent } from '../../common/shut-down/shutdown-modal.component';

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
  public pingInfo = { isAlive: false, isAuth: false, hostName: '' };
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

  @ViewChild(ShutdownModalComponent) child: ShutdownModalComponent;
  @ViewChild(RestartModalComponent) childRestart: RestartModalComponent;

  constructor(private servicesHealthService: ServicesHealthService,
    private status: ConnectedServiceStatus,
    private alertService: AlertService,
    public ngProgress: NgProgress,
    private sharedService: SharedService,
    private authService: AuthService,
    private changeDetectorRef: ChangeDetectorRef,
    private ping: PingService,
    private router: Router) {
    // Subscribe to automatically update
    // "isUserLoggedIn" whenever a change to the subject is made.
    this.sharedService.isUserLoggedIn.subscribe(value => {
      this.isUserLoggedIn = value.loggedIn;
      this.userName = value.userName;
      this.isAuthOptional = value.isAuth;
      this.pingService();
    });
  }

  ngOnInit() {
    this.getAllServices();
    this.pingService();
    this.ping.pingIntervalChanged.subscribe((pingTime: number) => {
      if (pingTime === -1) {
        this.stop();
      } else {
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
  }

  ngAfterViewInit() {
    // get user token from session
    const token = sessionStorage.getItem('token');
    if (token != null && token.length > 0) {
      this.isUserLoggedIn = true;
    }
    if (sessionStorage.getItem('userName') != null) {
      this.userName = sessionStorage.getItem('userName');
    }
    this.changeDetectorRef.detectChanges();
  }

  public getAllServices() {
    this.servicesHealthService.getAllServices()
      .subscribe(
        (data: any) => {
          this.servicesRecord = data.services;
        },
        (error) => {
          console.log('service down ', error);
        });
  }

  public pingService(pingManually = false) {
    if (pingManually === true) {
      this.ngProgress.start();
    }
    this.servicesHealthService.pingService().then(data => {
      if (pingManually === true) {
        this.ngProgress.done();
      }
      this.status.changeMessage(true);
      this.pingData = data;
      this.uptime = Utils.secondsToDhms(data['uptime']).roundOffTime;
      this.pingInfo = { isAlive: true, isAuth: false, hostName: this.pingData['hostName'] };
      if (data['authenticationOptional'] === true) {
        this.isUserLoggedIn = false;
        this.isAuthOptional = true;
        sessionStorage.removeItem('token');
        sessionStorage.setItem('isAdmin', JSON.stringify(false));
      }
      this.sharedService.isAdmin.next(JSON.parse(sessionStorage.getItem('isAdmin')));
      sessionStorage.setItem('LOGIN_SKIPPED', JSON.stringify(data['authenticationOptional']));
    })
      .catch((error) => {
        this.pingData = [];
        this.status.changeMessage(false);
        if (pingManually === true) {
          this.ngProgress.done();
        }
        if (error.status === 403) {
          sessionStorage.clear();
          this.pingInfo = { isAlive: true, isAuth: true, hostName: this.pingData['hostName'] };
        } else {
          this.pingInfo = { isAlive: false, isAuth: false, hostName: '' };
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
    const foglampDropdown = <HTMLDivElement>document.getElementById('foglamp-info');
    const classes = foglampDropdown.className.split(' ');
    for (const cls of classes) {
      if (cls === 'is-active') {
        foglampDropdown.classList.remove('is-active');
        return;
      }
    }
    foglampDropdown.classList.add('is-active');
  }

  openModal() {
    this.shutDownData = {
      key: 'shutdown',
      message: 'Do you really want to shut down the FogLAMP?'
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }

  openRestartModal() {
    this.restartData = {
      key: 'restart',
      message: 'Do you really want to restart the FogLAMP?'
    };
    // call childRestart component method to toggle modal
    this.childRestart.toggleModal(true);
  }

  restart() {
    /** request started */
    this.ngProgress.start();
    this.servicesHealthService.restart()
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
    this.servicesHealthService.shutdown()
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
      this.getAllServices();
    }.bind(this), pingInterval);
  }

  public stop() {
    clearInterval(this.timer);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
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
    if (serviceStatus.toLowerCase() === 'down') {
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
    this.authService.logout().
      subscribe(
        () => {
          sessionStorage.clear();
          this.ngProgress.done();
          this.router.navigate(['/login'], { replaceUrl: true });
          this.alertService.success('You have been successfully logged out!');
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }
}

