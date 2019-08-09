import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class SharedService {
  public isUserLoggedIn: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public isAdmin: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isServiceUp: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public showLogs: BehaviorSubject<any> = new BehaviorSubject<any>(false);
}
