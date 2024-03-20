import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { DeveloperFeaturesService } from '../services/developer-features.service';
import { RolesService } from '../services';

@Injectable()
export class DeveloperGuard {
  constructor(
    private router: Router,
    public rolesService: RolesService,
    public developerFeaturesService: DeveloperFeaturesService
  ) { }
  canActivate() {
    const canEdit = this.rolesService.hasEditPermissions();
    if (canEdit) {
      const isDeveloper = this.developerFeaturesService.getDeveloperFeatureControl();
      if (isDeveloper) {
        return true;
      }
    }
    this.router.navigateByUrl('');
    return false;
  }
}
