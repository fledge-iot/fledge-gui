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
  userName: string
  isSkip: boolean = false;

  @ViewChild(ShutdownModalComponent) child: ShutdownModalComponent;

  constructor(private servicesHealthService: ServicesHealthService,
    private status: ConnectedServiceStatus,
    private alertService: AlertService,
    public ngProgress: NgProgress,
    private sharedService: SharedService,
    private authService: AuthService,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router) {
    // Subscribe to automatically update 
    // "isUserLoggedIn" whenever a change to the subject is made.
    this.sharedService.isUserLoggedIn.subscribe(value => {
      this.isUserLoggedIn = value.loggedIn;
      this.userName = value.userName;
    });
    this.sharedService.isLoginSkiped.subscribe(value => {
      this.isSkip = value;
    });
  }

  ngOnInit() { }

  ngAfterViewInit() {
    // get user token from session
    const token = sessionStorage.getItem('token');
    const skip = sessionStorage.getItem('skip');
    if (token != null && token.length > 0) {
      this.isUserLoggedIn = true;
    } else if (skip != null && skip.trim().length > 0) {
      this.isSkip = true;
    }
    if(sessionStorage.getItem('userName') != null){
      this.userName = sessionStorage.getItem('userName');
    }
    this.start();
    this.changeDetectorRef.detectChanges();
  }


  pingService() {
    this.servicesHealthService.pingService()
      .subscribe(
        (data) => {
          this.status.changeMessage(true);
          this.ping_data = data;
          this.ping_info = { is_alive: true, service_status: 'running' };
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
      message: 'Do you really want to shut down the FogLAMP?'
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
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
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
    this.ngProgress.start();
    const uid = sessionStorage.getItem('uid')
    this.authService.logout(uid).
      subscribe(
        data => {
          this.ngProgress.done();
          // remove access token and logged in user from session storage
          sessionStorage.clear();
          location.reload();
          this.router.navigate(['/login']);
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
