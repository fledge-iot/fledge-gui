import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class AuditService {

  private GET_LOG_SOURCE = environment.BASE_URL + 'audit/logcode';
  private GET_LOG_SEVERITY = environment.BASE_URL + 'audit/severity';
  private GET_AUDIT_LOGS = environment.BASE_URL + 'audit';

  constructor(private http: HttpClient) { }

  /**
   *  GET | foglamp/audit/logcode
   */
  public getLogSource() {
    return this.http.get(this.GET_LOG_SOURCE).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
  *  GET | foglamp/audit/severity
  */
  public getLogSeverity() {
    return this.http.get(this.GET_LOG_SEVERITY).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   * GET | /foglamp/audit
   *
   * @param limit
   * @param offset
   * @param source
   * @param severity
   */
  public getAuditLogs(limit: Number = 0, offset: Number = 0, source: String, severity: String) {
    let params = new HttpParams();
    params = params.set('limit', limit.toString());
    params = params.set('skip', offset.toString());
    params = params.set('source', source.toUpperCase());
    params = params.set('severity', severity.toUpperCase());
    return this.http.get(this.GET_AUDIT_LOGS, { params: params }).pipe(map(response => response),
    catchError(error => throwError(error)));
  }
}
