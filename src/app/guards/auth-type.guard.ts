import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

enum appRoles { anonymous = 0, admin = 1, user = 2, view = 3, data_view = 4 };

@Injectable()
export class AuthTypeGuard implements CanActivate {
  constructor(private router: Router) { }
  canActivate() {
    const roleId = Number(sessionStorage.getItem('roleId'));
    if([appRoles.admin, appRoles.user, appRoles.anonymous].includes(roleId)){
      return true;
    }
    this.router.navigate(['']);
    return false;
  }
}
