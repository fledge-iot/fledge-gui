import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { RolesService } from '../services';

@Injectable()
export class RolesGuard  {
  constructor(private router: Router, public rolesService: RolesService) { }
  canActivate() {
    const canEdit = this.rolesService.hasEditPermissions();
    if (canEdit) {
      return true;
    }
    this.router.navigateByUrl('');
    return false;
  }
}
