import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { RolesService } from '../services';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private router: Router, public rolesService: RolesService) { }
  canActivate() {
    const isEditor = this.rolesService.hasEditorRole();
    if (isEditor) {
      return true;
    }
    this.router.navigateByUrl('');
    return false;
  }
}
