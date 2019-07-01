import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class ServicesApiService {
  private GET_SERVICES_URL = environment.BASE_URL + 'service';
  private SOUTH_URL = environment.BASE_URL + 'south';
  private AVAILABLE_PLUGINS_URL = environment.BASE_URL + 'plugins/available';
  private POST_PLUGINS_URL = environment.BASE_URL + 'plugins';

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
   *  DELETE | /foglamp/service/{svc_name}
   */
  deleteService(svc) {
    return this.http.delete(this.GET_SERVICES_URL + '/' + encodeURIComponent(svc)).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  GET  | /foglamp/south
   */
  getSouthServices(caching: boolean) {
    let url = this.SOUTH_URL;
    if (caching === false) {
      url = `${this.SOUTH_URL}?cached=${caching}`;
    }
    return this.http.get(url).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  GET  | /foglamp/service/available
   */
  getAvailableServicePackages() {
    return this.http.get(`${this.GET_SERVICES_URL}/available`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  GET  | /foglamp/plugins/available
   */
  getAvailablePlugins(pluginType: string) {
    return this.http.get(`${this.AVAILABLE_PLUGINS_URL}?type=${pluginType}`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   * POST | /foglamp/plugin
   * @param payload plugin data
   */
  installPlugin(payload: any) {
    return this.http.post(this.POST_PLUGINS_URL, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   * POST | /foglamp/service?action=install
   * @param payload service data
   */
  installService(payload: any) {
    return this.http.post(`${this.GET_SERVICES_URL}?action=install`, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}
