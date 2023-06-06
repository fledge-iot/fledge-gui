import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private router: Router) { }
  canActivate() {
    if (sessionStorage.getItem('token')) {
      // logged in so return true
      return true;
    }
    else{
      this.router.navigate(['']);
      return false;
    }
  }
}
