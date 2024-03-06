import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class SystemAlertService {
  constructor(private http: HttpClient) { }

  public getAlerts() {
    return this.http.get(environment.BASE_URL + 'alert').pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  public deleteAlert(alertKey) {
    return this.http.delete(environment.BASE_URL + 'alert/' + encodeURIComponent(alertKey)).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  public deleteAllAlerts() {
    return this.http.delete(environment.BASE_URL + 'alert').pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  public update() {
    return this.http.put(environment.BASE_URL + 'update', null).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}
