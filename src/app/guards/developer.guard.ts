import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { DeveloperFeaturesService } from '../services/developer-features.service';

@Injectable()
export class DeveloperGuard implements CanActivate {
  constructor(public developerFeaturesService: DeveloperFeaturesService) { }
  canActivate() {
    return this.developerFeaturesService.getDeveloperFeatureControl();
  }
}
