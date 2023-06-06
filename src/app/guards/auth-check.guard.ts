import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable()
export class AuthCheckGuard implements CanActivate {
  constructor(private router: Router) { }
  canActivate() {
    if (sessionStorage.getItem('token') || sessionStorage.getItem('LOGIN_SKIPPED') == 'true') {
      // return true for (auth=optional) or (auth=mandatory and user role=any)
      return true;
    }
    // redirect to login for auth=mandatory and without any user token i.e. trying to access from url
    this.router.navigate(['/login']);
    return false;
  }
}
