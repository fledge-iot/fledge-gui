import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { POLLING_INTERVAL } from '../utils';

@Injectable()
export class PingService {
  pingIntervalChanged: BehaviorSubject<number> = new BehaviorSubject(0);
  constructor() { }

  public setDefaultPingTime() {
    const pingTime = localStorage.getItem('pingInterval');
    if (pingTime == null) {
      localStorage.setItem('pingInterval', JSON.stringify(POLLING_INTERVAL));
    }
  }
}
