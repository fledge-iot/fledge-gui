import { Injectable } from '@angular/core';
import { BehaviorSubject, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { GRAPH_REFRESH_INTERVAL, POLLING_INTERVAL } from '../utils';

@Injectable()
export class PingService {
  private FLEDGE_SHUTDOWN_URL = environment.BASE_URL + 'shutdown';
  private FLEDGE_RESTART_URL = environment.BASE_URL + 'restart';
  private GET_PING_URL = environment.BASE_URL + 'ping';
  private REQUEST_TIMEOUT_INTERVAL = 5000;
  pingIntervalChanged: BehaviorSubject<number> = new BehaviorSubject(0);
  refreshIntervalChanged: BehaviorSubject<number> = new BehaviorSubject(GRAPH_REFRESH_INTERVAL);
  pingResponse: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  constructor(private http: HttpClient) { }

  /**
   *  GET  | /fledge/ping
   */
   pingService(): Promise<any> {
    return this.http.get(this.GET_PING_URL)
      .pipe(timeout(this.REQUEST_TIMEOUT_INTERVAL))
      .toPromise()
      .then((res) => {
        this.pingResponse.next(true);
        return Promise.resolve(res);
        })
      .catch(err => {
        if (err.status === 0 || err.status === 404) {
          this.pingResponse.next(false);
        } else {
          this.pingResponse.next(true);
        }
        return Promise.reject(err);
      }
      );
  }

  /**
   *  PUT  | /fledge/shutdown
   */
  shutdown() {
    return this.http.put(this.FLEDGE_SHUTDOWN_URL, null).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  PUT  | /fledge/restart
   */
  restart() {
    return this.http.put(this.FLEDGE_RESTART_URL, null).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  checkUpdate() {
    return this.http.get(environment.BASE_URL + 'update').pipe(
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
