import { Component, OnInit, Output, EventEmitter, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ServicesHealthService } from '../services/index';
import { ConnectedServiceStatus } from "../services/connected-service-status.service";
import { POLLING_INTERVAL } from '../utils';
import { ShutdownModalComponent } from './../shut-down/shutdown-modal.component';
import { NgProgress } from 'ngx-progressbar';
import { AlertService, AuthService } from './../services/index';
import { SharedService } from './../services/shared.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, AfterViewInit {
  @Output() toggle = new EventEmitter<string>();
  public timer: any = '';
  public ping_data = {};
  public ping_info = { is_alive: false, service_status: 'service down' };
  public shutDownData = {
    key: '',
    message: ''
  };

  // Define a variable to use for showing/hiding the Login button
  isUserLoggedIn: boolean;
  loggedInUserName: string;

  @ViewChild(ShutdownModalComponent) child: ShutdownModalComponent;

  constructor(private servicesHealthService: ServicesHealthService,
    private status: ConnectedServiceStatus,
    private alertService: AlertService,
    public ngProgress: NgProgress,
    private sharedService: SharedService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router) {
    // Subscribe to automatically update 
    // "isUserLoggedIn" whenever a change to the subject is made.
    this.sharedService.IsUserLoggedIn.subscribe(value => {
      this.isUserLoggedIn = value.loggedIn;
      this.loggedInUserName = value.userName;
    });
  }

  ngOnInit() { }

  ngAfterViewInit() {
    // get loggedin user from session
    this.loggedInUserName = sessionStorage.getItem('currentUser');
    if (this.loggedInUserName != null && this.loggedInUserName.length > 0) {
      this.isUserLoggedIn = true;
    }
    this.start();
    this.cdr.detectChanges();
  }


  pingService() {
    this.servicesHealthService.pingService()
      .subscribe(
        (data) => {
          this.status.changeMessage(true);
          this.ping_data = data;
          this.ping_info = { is_alive: true, service_status: 'running...' };
        },
        (error) => {
          console.log('error: ', error);
          this.status.changeMessage(false);
          this.ping_info = { is_alive: false, service_status: 'service down' };
        },
    );
  }

  openModal() {
    this.shutDownData = {
      key: 'shutdown',
      message: 'Do you really want to shut down the FogLAMP ?'
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }

  shutdown(port) {
    /** request started */
    this.ngProgress.start();
    this.servicesHealthService.shutdown()
      .subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data.message);
        },
        (error) => {
          if (error.status === 0) {
            console.log('service down ', error);
            /** request completed */
            this.ngProgress.done();
          } else {
            this.alertService.error(error.statusText);
            /** request completed */
            this.ngProgress.done();
          }
        });
  }

  start() {
    clearInterval(this.timer);
    this.timer = setInterval(function () {
      this.pingService();
    }.bind(this), POLLING_INTERVAL);
  }
  stop() {
    clearInterval(this.timer);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  toggleClick() {
    this.toggle.next('toggleSidebar');
  }

  /**
     *  Signout the current user
     */
  logout() {
    let token = sessionStorage.getItem('token');
    this.authService.logout(token).
      subscribe(
        data => {
          // remove access token and logged in user from session storage
          sessionStorage.removeItem('currentUser');
          location.reload();
          this.router.navigate(['/login']);
        },
        error => {
          if (error.status === 0) {
            console.log('service down', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }
}
