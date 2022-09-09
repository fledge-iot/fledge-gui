import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeveloperFeaturesService {
  constructor() { }

  public setDeveloperFeatureControl(visible: boolean) {
    localStorage.setItem('DEV_FEATURES', JSON.stringify(visible));
  }

  public getDeveloperFeatureControl(): boolean {
    const controlStatus: boolean = JSON.parse(localStorage.getItem('DEV_FEATURES'));
    return controlStatus ? controlStatus : false;
  }

}
