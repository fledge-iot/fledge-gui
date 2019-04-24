import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class ServicesApiService {
  private GET_SERVICES_URL = environment.BASE_URL + 'service';
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
   *  DELETE | /foglamp/service/{svc_name}
   */
  public deleteService(svc) {
    return this.http.delete(this.GET_SERVICES_URL + '/' + encodeURIComponent(svc)).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  GET  | /foglamp/south
   */
  getSouthServices() {
    return this.http.get(this.SOUTH_URL).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}
