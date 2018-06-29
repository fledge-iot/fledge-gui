import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, AuthService, ConnectedServiceStatus, PingService, ServicesHealthService } from '../../../services';
import { SharedService } from '../../../services/shared.service';
import { ShutdownModalComponent } from '../../common/shut-down/shutdown-modal.component';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() toggle = new EventEmitter<string>();
  public timer: any = '';
  public ping_data = {};
  public ping_info = { stats: 'No data', is_alive: false, is_auth: false, service_status: 'service down' };
  public shutDownData = {
    key: '',
    message: ''
  };

  // Define a variable to use for showing/hiding the Login button
  isUserLoggedIn: boolean;
  userName: string;
  isAuthorize = false;  // Default to true for authorized access

  @ViewChild(ShutdownModalComponent) child: ShutdownModalComponent;

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
      this.pingService();
    });
  }

  ngOnInit() {
    this.pingService();
    this.ping.pingIntervalChanged.subscribe((pingTime: number) => {
      if (pingTime === 0) {
        this.stop();
      } else {
        this.start(pingTime);
      }
    });
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


  public pingService(pingManually = false) {
    if (pingManually === true) {
      this.ngProgress.start();
    }
    this.servicesHealthService.pingService().then(data => {
      if (pingManually === true) {
        this.ngProgress.done();
      }
      this.status.changeMessage(true);
      this.ping_data = data;
      const statsTxt = 'Read: ' + data['dataRead'] + '\n' + 'Sent: ' + data['dataSent'] + '\n' + 'Purged: ' + data['dataPurged'];
      this.ping_info = { stats: statsTxt, is_alive: true, is_auth: false, service_status: 'running' };
      if (data['authenticationOptional'] === true) {
        this.isUserLoggedIn = false;
        sessionStorage.removeItem('token');
        sessionStorage.setItem('isAdmin', JSON.stringify(false));
      }
      this.sharedService.isAdmin.next(JSON.parse(sessionStorage.getItem('isAdmin')));
      sessionStorage.setItem('LOGIN_SKIPPED', JSON.stringify(data['authenticationOptional']));
    })
      .catch((error) => {
        this.status.changeMessage(false);
        if (pingManually === true) {
          this.ngProgress.done();
        }
        if (error.status === 403) {
          sessionStorage.clear();
          this.ping_info = { stats: 'Auth Required', is_alive: true, is_auth: true, service_status: 'running' };
        } else {
          this.ping_info = { stats: 'No Data', is_alive: false, is_auth: false, service_status: 'service down' };
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

  openModal() {
    this.shutDownData = {
      key: 'shutdown',
      message: 'Do you really want to shut down the FogLAMP?'
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }

  shutdown() {
    /** request started */
    this.ngProgress.start();
    this.servicesHealthService.shutdown()
      .subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
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
  }

  toggleClick() {
    this.toggle.next('toggleSidebar');
  }

  applyServiceStatusCustomCss(pingInfo) {
    if (pingInfo.is_alive && !pingInfo.is_auth) {
      return 'is-success';
    }
    if (pingInfo.is_alive && pingInfo.is_auth) {
      return 'is-warning';
    }
    if (!pingInfo.is_alive && !pingInfo.is_auth) {
      return 'is-danger';
    }
  }

  applyServiceStatusIconCss(pingInfo) {
    if (pingInfo.is_alive && !pingInfo.is_auth) {
      return 'fa fa-check-circle-o';
    }
    if (pingInfo.is_alive && pingInfo.is_auth) {
      return 'fa fa-lock';
    }
    if (!pingInfo.is_alive && !pingInfo.is_auth) {
      return 'fa fa-times-circle';
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

