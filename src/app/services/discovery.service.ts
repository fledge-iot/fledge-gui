import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { InterceptorSkipHeader } from '../services/http.request.interceptor';

@Injectable()
export class DiscoveryService {

  constructor(private http: HttpClient) { }

  /**
   *  GET  | /foglamp/discover
   */
  discover(discoveryUrl) {
    const headers = new HttpHeaders().set(InterceptorSkipHeader, '');
    return this.http.get(discoveryUrl, { headers: headers }).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}


