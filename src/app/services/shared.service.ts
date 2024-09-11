import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class SharedService {
  public isUserLoggedIn: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public isAdmin: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public dataViewUserSubject: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public showLogs: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public theme: BehaviorSubject<any> = new BehaviorSubject<any>(localStorage.getItem('OPTED_THEME') != null ?
    localStorage.getItem('OPTED_THEME') : 'light');
  public viewport: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public assets: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public connectionInfo: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public loginScreenSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public allServicesInfo: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public installedServicePkgs: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public isSidebarCollapsed: BehaviorSubject<any> = new BehaviorSubject<any>(false);

  public checkAuth() {
    const auth = !JSON.parse(sessionStorage.getItem('LOGIN_SKIPPED'));
    const admin = JSON.parse(sessionStorage.getItem('isAdmin'));
    if (auth && admin) {
      return true;
    } else if (auth && !admin) {
      return false;
    }
    return true;
  }
}
