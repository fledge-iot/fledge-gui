import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { DeveloperFeaturesService } from '../services/developer-features.service';

@Injectable()
export class DeveloperGuard implements CanActivate {
  constructor(private router: Router, public developerFeaturesService: DeveloperFeaturesService) { }
  canActivate() {
    const isDeveloper = this.developerFeaturesService.getDeveloperFeatureControl();
    if (isDeveloper) {
      return true;
    }
    this.router.navigateByUrl('');
    return false;
  }
}
