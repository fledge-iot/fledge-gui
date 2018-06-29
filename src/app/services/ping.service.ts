import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { POLLING_INTERVAL } from '../utils';

@Injectable()
export class PingService {
  pingIntervalChanged: BehaviorSubject<number> = new BehaviorSubject(0);
  constructor() { }

  public setDefaultPingTime() {
    const pingTime = localStorage.getItem('PING_INTERVAL');
    if (pingTime == null) {
      localStorage.setItem('PING_INTERVAL', JSON.stringify(POLLING_INTERVAL));
    }
  }
}
