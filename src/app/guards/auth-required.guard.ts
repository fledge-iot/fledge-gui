import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable()
export class AuthRequiredGuard implements CanActivate {
  constructor(private router: Router) { }
  canActivate() {
    if (sessionStorage.getItem('token') || sessionStorage.getItem('LOGIN_SKIPPED') == 'true') {
      // return true for (auth=optional) OR (auth=mandatory and token is available)
      return true;
    }
    // redirect to login for auth=mandatory and without any user token i.e. trying to access pages URL
    this.router.navigate(['/login']);
    return false;
  }
}
