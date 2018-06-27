import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertService, AuthService, UserService } from '../../../services/index';
import { SharedService } from '../../../services/shared.service';
import { NgProgress } from 'ngx-progressbar';

@Component({
  moduleId: module.id.toString(),
  selector: 'app-login',
  templateUrl: 'login.component.html'
})

export class LoginComponent implements OnInit {
  model: any = {};
  returnUrl: string;
  constructor(
    private router: Router,
    private authService: AuthService,
    private alertService: AlertService,
    private sharedService: SharedService,
    private userService: UserService,
    public ngProgress: NgProgress) {
    this.sharedService.isUserLoggedIn.next({
      'loggedIn': false
    });
    this.sharedService.isLoginSkiped.next(false);
  }

  ngOnInit() {
    // clear session
    this.resetSession();
  }

  /**
   *  login user into system
   */
  login() {
    this.ngProgress.start();
    this.authService.login(this.model.username, this.model.password).
      subscribe(
        (data) => {
          this.ngProgress.done();
          sessionStorage.setItem('token', data['token']);
          sessionStorage.setItem('uid', data['uid']);
          sessionStorage.setItem('isAdmin', JSON.stringify(data['admin']));
          sessionStorage.setItem('skip', JSON.stringify(false));
          this.getUser(data['uid']);
          this.router.navigate(['']);
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down', error);
          } else if (error.status === 401) {
            // to open reset password screen
            sessionStorage.setItem('skip', JSON.stringify(false));
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

  public skip() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('uid');
    this.sharedService.isLoginSkiped.next(true);
    sessionStorage.setItem('skip', JSON.stringify(true));
    this.router.navigate(['']);
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
            'userName': userData['userName']
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

  public resetSession() {
    sessionStorage.clear();
  }

  public forgotPassword() {
    this.alertService.warning('Please ask the administrator to reset your password.');
  }
}
