import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class SystemAlertService {
  constructor(private http: HttpClient) { }

  /**
   *  GET | /fledge/alert
   */
  public getAlerts() {
    return this.http.get(environment.BASE_URL + 'alert').pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}
