import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../../../services/storage.service';

import { AlertService, AuthService, PingService, UserService, ProgressBarService } from '../../../services';
import { SharedService } from '../../../services/shared.service';
import { CertificateBaseLoginComponent } from '../certificate-base-login';

@Component({
  moduleId: module.id.toString(),
  selector: 'app-login',
  templateUrl: 'login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit, AfterViewInit {
  model: any = {};
  returnUrl: string;
  ottToken: string = null;

  @ViewChild(CertificateBaseLoginComponent, { static: true }) certificateBaseLogin: CertificateBaseLoginComponent;
  constructor(
    private router: Router,
    private authService: AuthService,
    private alertService: AlertService,
    private sharedService: SharedService,
    private userService: UserService,
    private ping: PingService,
    private route: ActivatedRoute,
    public storageService: StorageService,
    public ngProgress: ProgressBarService) {
    this.sharedService.isUserLoggedIn.next({
      'loggedIn': false,
      'isAuthOptional': JSON.parse(sessionStorage.getItem('LOGIN_SKIPPED'))
    });

    this.route.queryParams.subscribe(params => {
      console.log('login ott', params);
      if (params?.ott) {
        this.ottToken = params.ott;
        const scheme = params.scheme;
        const host = params.address;
        const port = params.port;
        const serviceUrl = `${scheme}://${host}:${port}/fledge/`;
        console.log('serviceUrl', serviceUrl);
        this.storageService.setServiceURL(serviceUrl);
      }
    });
  }

  ngOnInit() {

  }

  ngAfterViewInit() {
    if (this.ottToken) {
      this.loginUsingOttToken();
    } else if (sessionStorage.getItem('token')) {
      this.sharedService.isUserLoggedIn.next({
        'loggedIn': true,
        'userName': sessionStorage.getItem('userName'),
        'isAuthOptional': JSON.parse(sessionStorage.getItem('LOGIN_SKIPPED'))
      });
      this.router.navigate(['']);
    } else if (JSON.parse(sessionStorage.getItem('LOGIN_SKIPPED'))) {
      this.router.navigate(['']);
    }
  }

  /**
  * Open certificate login modal dialog
  */
  openLoginWithCertificateModal() {
    // call child component method to toggle modal
    this.certificateBaseLogin.toggleModal(true);
  }

  loginUsingOttToken() {
    this.ngProgress.start();
    this.authService.loginUsingOttToken(this.ottToken).
      subscribe(
        (data) => {
          const pingInterval = JSON.parse(localStorage.getItem('PING_INTERVAL'));
          this.ping.pingIntervalChanged.next(pingInterval);
          this.ngProgress.done();
          sessionStorage.setItem('token', data['token']);
          sessionStorage.setItem('uid', data['uid']);
          sessionStorage.setItem('isAdmin', JSON.stringify(data['admin']));
          this.getUser(data['uid']);
          this.router.navigate([''], { replaceUrl: true });
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down', error);
          } else if (error.status === 401) {
            this.alertService.error(error.statusText, true);
          } else {
            this.alertService.error(error.statusText, true);
          }
        });
  }

  /**
   *  login user into system
   */
  login() {
    this.ngProgress.start();
    this.authService.login(this.model.username, this.model.password).
      subscribe(
        (data) => {
          const pingInterval = JSON.parse(localStorage.getItem('PING_INTERVAL'));
          this.ping.pingIntervalChanged.next(pingInterval);
          this.ngProgress.done();
          sessionStorage.setItem('token', data['token']);
          sessionStorage.setItem('uid', data['uid']);
          sessionStorage.setItem('isAdmin', JSON.stringify(data['admin']));
          this.getUser(data['uid']);
          this.router.navigate([''], { replaceUrl: true });
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down', error);
          } else if (error.status === 401) {
            // to open reset password screen
            if (error.statusText.toUpperCase().indexOf('PASSWORD') >= 0
              && error.statusText.toUpperCase().indexOf('EXPIRED') >= 0) {
              this.router.navigate(['/user/reset-password'], { queryParams: { username: this.model.username } });
            }
            this.alertService.error(error.statusText, true);
          } else {
            this.alertService.error(error.statusText, true);
          }
        });
  }

  public setupInstance() {
    this.router.navigate(['/setting'], { queryParams: { id: '1' } });
  }

  getUser(id) {
    // Get SignedIn user details
    this.userService.getUser(id)
      .subscribe(
        (userData) => {
          this.sharedService.isUserLoggedIn.next({
            'loggedIn': true,
            'userName': userData['userName'],
            'isAuthOptional': JSON.parse(sessionStorage.getItem('LOGIN_SKIPPED'))
          });
          sessionStorage.setItem('userName', userData['userName']);
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public forgotPassword() {
    this.alertService.warning('Please ask the administrator to reset your password.');
  }
}
