import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeveloperFeaturesService {
  constructor() { }

  public setDeveloperFeatureControl(visible: boolean) {
    localStorage.setItem('DEV_FEATURES_STATUS', JSON.stringify(visible));
  }

  public getDeveloperFeatureControl(): boolean {
    const controlStatus: boolean = JSON.parse(localStorage.getItem('DEV_FEATURES_STATUS'));
    return controlStatus ? controlStatus : false;
  }

}
