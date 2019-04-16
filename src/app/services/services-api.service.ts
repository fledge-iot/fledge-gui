import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { InterceptorSkipHeader } from '../services/http.request.interceptor';

@Injectable()
export class ServicesAPIService {
  private GET_SERVICES_URL = environment.BASE_URL + 'service';
  private GET_INSTALLED_PLUGINS_URL = environment.BASE_URL + 'plugins/installed';
  private TRACK_SERVICE_URL = environment.BASE_URL + 'track';
  private SOUTH_URL = environment.BASE_URL + 'south';

  constructor(private http: HttpClient) { }

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
