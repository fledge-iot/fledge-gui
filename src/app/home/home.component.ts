import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/index';
import { Observable } from 'rxjs/Rx';


@Component({
    moduleId: module.id.toString(),
    templateUrl: 'home.component.html',
})

export class HomeComponent {
    currentUser: String;
    private timer: any = '';
    xdata: {} = {};
    private errorMessage: any = '';
    options: Object;
    constructor(private router: Router, private authService: AuthService) {
        this.currentUser = sessionStorage.getItem('currentUser');
        this.options = {
            minValue: 0,
            maxValue: 255,
            // width: 300,
            // height: 300
        };
    }
}
