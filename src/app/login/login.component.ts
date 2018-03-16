import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertService, AuthService, UserService } from '../services/index';
import { SharedService } from './../services/shared.service';
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
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private alertService: AlertService,
        private sharedService: SharedService,
        private userService: UserService,
        public ngProgress: NgProgress) {
        this.sharedService.isUserLoggedIn.next({
            'loggedIn': false
        });
    }

    ngOnInit() {
        // clear session
        this.resetSession();
        // get return url from route parameters or default to '/'
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    /**
     *  login user into system
     */
    login() {
        this.ngProgress.start();
        this.authService.login(this.model.username, this.model.password).
            subscribe(
                data => {
                    this.ngProgress.done();
                    sessionStorage.setItem('token', data.token);
                    sessionStorage.setItem('uid', data.uid);
                    sessionStorage.setItem('isAdmin', JSON.stringify(data.admin));
                    this.getUser(data.uid);
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

    public skip() {
        sessionStorage.setItem('skip', JSON.stringify(true));
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('isAdmin')
        sessionStorage.removeItem('uid')
        this.sharedService.isLoginSkiped.next(true);
        this.router.navigate(['']);
    }

    public setupInstance() {
        this.router.navigate(['/setting']);
    }

    getUser(id) {
        // Get SignedIn user details
        this.userService.getUser(id)
            .subscribe(
                userData => {
                    this.router.navigate([this.returnUrl]);
                    this.sharedService.isUserLoggedIn.next({
                        'loggedIn': true,
                        'userName': userData.userName
                    });
                    sessionStorage.setItem("userName", userData.userName);
                },
                error => {
                    if (error.status === 0) {
                        console.log('service down ', error);
                    } else {
                        this.alertService.error(error.statusText);
                    };
                });
    }

    public resetSession(){
        sessionStorage.clear();
    }
}
