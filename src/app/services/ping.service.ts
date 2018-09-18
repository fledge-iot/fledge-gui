import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { GRAPH_REFRESH_INTERVAL, POLLING_INTERVAL } from '../utils';

@Injectable()
export class PingService {
  pingIntervalChanged: BehaviorSubject<number> = new BehaviorSubject(0);
  refreshIntervalChanged: BehaviorSubject<number> = new BehaviorSubject(GRAPH_REFRESH_INTERVAL);
  constructor() { }

  public setDefaultPingTime() {
    const pingTime = localStorage.getItem('PING_INTERVAL');
    if (pingTime == null) {
      localStorage.setItem('PING_INTERVAL', JSON.stringify(POLLING_INTERVAL));
    }
  }

  public setDefaultRefreshGraphTime() {
    const refreshTime = localStorage.getItem('DASHBOARD_GRAPH_REFRESH_INTERVAL');
    if (refreshTime == null) {
      localStorage.setItem('DASHBOARD_GRAPH_REFRESH_INTERVAL', JSON.stringify(GRAPH_REFRESH_INTERVAL));
    }
  }
}
