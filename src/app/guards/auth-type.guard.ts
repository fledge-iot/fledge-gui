import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable()
export class AuthTypeGuard implements CanActivate {
  constructor(private router: Router) { }
  canActivate() {
    const auth = !JSON.parse(sessionStorage.getItem('LOGIN_SKIPPED'));
    const admin = JSON.parse(sessionStorage.getItem('isAdmin'));
    if (auth && admin) {
      return true;
    } else if (auth && !admin) {
      this.router.navigate(['']);
      return false;
    }
    return true;

  }
}
