import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertService, AuthService } from '../services/index';
import { SharedService } from './../services/shared.service';

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
        private sharedService: SharedService) {
        this.sharedService.IsUserLoggedIn.next({
            'loggedIn': false
        });
    }

    ngOnInit() {
        // get return url from route parameters or default to '/'
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    /**
     *  login user into system
     */
    login() {
        this.authService.login(this.model.username, this.model.password).
            subscribe(
                data => {
                    sessionStorage.setItem('token', data);
                    // Get SignedIn user details
                    this.authService.getWhoAmi(data)
                        .subscribe(
                            userData => {
                                this.sharedService.IsUserLoggedIn.next({
                                    'loggedIn': true,
                                    'userName': this.model.username
                                });
                                sessionStorage.setItem('currentUser', this.model.username);
                                this.router.navigate([this.returnUrl]);
                            });
                },
                error => {
                    if (error.status === 0) {
                        console.log('service down', error);
                    } else {
                        this.alertService.error(error.statusText);
                    }
                });
    }

    // TODO: Not implemented yet
    private skip() {
        // this.router.navigate(['/'], { queryParams: { skip: true } });
    }
}
