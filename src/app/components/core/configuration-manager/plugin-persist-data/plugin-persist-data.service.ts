import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PluginPersistDataService {
  private SERVICE_URL = environment.BASE_URL + 'service';
  constructor(private http: HttpClient) { }

  public getData(serviceName: string, pluginName: string) {
    return this.http.get(`${this.SERVICE_URL}/${encodeURIComponent(serviceName)}/plugin/${encodeURIComponent(pluginName)}/data`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  public importData(serviceName: string, pluginName: string, payload: any) {
    return this.http.post(`${this.SERVICE_URL}/${encodeURIComponent(serviceName)}/plugin/${encodeURIComponent(pluginName)}/data`, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  public deleteData(serviceName: string, pluginName: string) {
    return this.http.delete(`${this.SERVICE_URL}/${encodeURIComponent(serviceName)}/plugin/${encodeURIComponent(pluginName)}/data`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

}
