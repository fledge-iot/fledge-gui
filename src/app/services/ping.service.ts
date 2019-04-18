import { Injectable } from '@angular/core';
import { BehaviorSubject, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { GRAPH_REFRESH_INTERVAL, POLLING_INTERVAL } from '../utils';

@Injectable()
export class PingService {
  private FOGLAMP_SHUTDOWN_URL = environment.BASE_URL + 'shutdown';
  private FOGLAMP_RESTART_URL = environment.BASE_URL + 'restart';
  private GET_PING_URL = environment.BASE_URL + 'ping';
  private REQUEST_TIMEOUT_INTERVAL = 5000;
  pingIntervalChanged: BehaviorSubject<number> = new BehaviorSubject(0);
  refreshIntervalChanged: BehaviorSubject<number> = new BehaviorSubject(GRAPH_REFRESH_INTERVAL);
  constructor(private http: HttpClient) { }

  /**
   *  GET  | /foglamp/ping
   */
  pingService(): Promise<any> {
    return this.http.get(this.GET_PING_URL)
      .pipe(timeout(this.REQUEST_TIMEOUT_INTERVAL))
      .toPromise()
      .catch(err => Promise.reject(err));
  }

  /**
   *  PUT  | /foglamp/shutdown
   */
  shutdown() {
    return this.http.put(this.FOGLAMP_SHUTDOWN_URL, null).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  PUT  | /foglamp/restart
   */
  restart() {
    return this.http.put(this.FOGLAMP_RESTART_URL, null).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

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
