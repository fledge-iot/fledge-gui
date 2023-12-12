import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class AuthenticatedUserGuard  {
  constructor(private router: Router) { }
  canActivate() {
    if (sessionStorage.getItem('token')) {
      // logged in so return true
      return true;
    }
    this.router.navigate(['']);
    return false;
  }
}
