import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { InterceptorSkipHeader } from '../services/http.request.interceptor';

@Injectable()
export class ServicesHealthService {
  private GET_PING_URL = environment.BASE_URL + 'ping';
  private FOGLAMP_SHUTDOWN_URL = environment.BASE_URL + 'shutdown';
  private FOGLAMP_RESTART_URL = environment.BASE_URL + 'restart';
  private GET_SERVICES_URL = environment.BASE_URL + 'service';
  private GET_INSTALLED_PLUGINS_URL = environment.BASE_URL + 'plugins/installed';
  private TRACK_SERVICE_URL = environment.BASE_URL + 'track';
  private REQUEST_TIMEOUT_INTERVAL = 5000;
  private SOUTH_URL = environment.BASE_URL + 'south';

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

  /**
   *  GET  | /foglamp/service
   */
  getAllServices() {
    return this.http.get(this.GET_SERVICES_URL).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
  *  POST  | /foglamp/service
  */
  addService(payload) {
    return this.http.post(this.GET_SERVICES_URL, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  POST  | /foglamp/service/shutdown
   */
  shutDownService(svcInfo) {
    const port = svcInfo.port;
    const protocol = svcInfo.protocol;
    const headers = new HttpHeaders().set(InterceptorSkipHeader, '');
    const baseUrl = this.GET_SERVICES_URL;
    const serviceUrl = baseUrl.replace(/^https?/i, protocol);
    const url = new URL(serviceUrl);
    url.port = port;
    return this.http.post(String(url) + '/shutdown', { headers: headers }).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  DELETE | /foglamp/service/{svc_name}
   */
  public deleteService(svc) {
    return this.http.delete(this.GET_SERVICES_URL + '/' + encodeURIComponent(svc)).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  GET  | /foglamp/plugin/installed
   */
  getInstalledPlugins(direction) {
    let params = new HttpParams();
    params = params.append('type', direction);
    params = params.append('config', JSON.stringify(true));
    return this.http.get(this.GET_INSTALLED_PLUGINS_URL, { params: params }).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  GET  | /foglamp/track?service=<serviceName>
   */
  getInstalledPluginAsset(serviceName) {
    const params = new HttpParams().set('service', serviceName);
    return this.http.get(this.TRACK_SERVICE_URL, { params: params }).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  getSouthServices() {
    return this.http.get(this.SOUTH_URL).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}
