import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertService, AuthService } from '../services/index';
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
        public ngProgress: NgProgress) {
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
        this.ngProgress.start();
        this.authService.login(this.model.username, this.model.password).
            subscribe(
                data => {
                    this.ngProgress.done();
                    sessionStorage.setItem('token', data.token);
                    this.router.navigate([this.returnUrl]);
                    this.sharedService.IsUserLoggedIn.next({
                        'loggedIn': true
                    });
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

    private skip() {
        sessionStorage.setItem('skip', JSON.stringify(true));
        this.sharedService.IsLoginSkiped.next(true);
        this.router.navigate(['']);
    }

    private setupInstance() {
        this.router.navigate(['/setting']);
    }
}
