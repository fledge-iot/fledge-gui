import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SharedService } from './../services/shared.service';

@Injectable()
export class AuthGuard implements CanActivate {
    skip:boolean;
    constructor(private router: Router,  private sharedService: SharedService,) {}
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        this.sharedService.IsLoginSkiped.subscribe(value => {
           this.skip = value;
          });
        if (sessionStorage.getItem('currentUser') || this.skip) {
            // logged in so return true
            return true;
        }
        // not logged in so redirect to login page with the return url
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url }});
        return false;
    }
}
