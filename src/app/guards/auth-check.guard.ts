import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable()
export class AuthCheckGuard implements CanActivate {
  constructor(private router: Router) { }
  canActivate() {
    if (sessionStorage.getItem('token') || sessionStorage.getItem('LOGIN_SKIPPED')) {
      // logged in so return true
      return true;
    }
    // not logged in so redirect to login page
    this.router.navigate(['/login']);
    return false;
  }
}
