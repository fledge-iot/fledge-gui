import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class PluginService {
  private GET_INSTALLED_PLUGINS_URL = environment.BASE_URL + 'plugins/installed';
  private TRACK_SERVICE_URL = environment.BASE_URL + 'track';

  constructor(private http: HttpClient) { }

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
}
