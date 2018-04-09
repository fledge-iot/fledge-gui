import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { POLLING_INTERVAL } from '../utils';

@Injectable()
export class PingService {
  isPingIntervalChanged: BehaviorSubject<boolean> = new BehaviorSubject(false);
  constructor() { }

  public setDefaultPingTime() {
    const pingTime = localStorage.getItem('pingInterval');
    if (pingTime == null) {
      localStorage.setItem('pingInterval', JSON.stringify(POLLING_INTERVAL));
    }
  }
}
