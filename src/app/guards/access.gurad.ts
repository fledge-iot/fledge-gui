import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { RolesService } from '../services';

@Injectable()
export class AccessGuard {
  constructor(private router: Router, public rolesService: RolesService) { }
  canActivate() {
    const canEdit = this.rolesService.hasAccessPermissions();
    if (canEdit) {
      return true;
    }
    this.router.navigateByUrl('');
    return false;
  }
}
