import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { environment } from '../../environments/environment';

@Injectable()
export class AuditService {

  private GET_LOG_SOURCE = environment.BASE_URL + 'audit/logcode';
  private GET_LOG_SEVERITY = environment.BASE_URL + 'audit/severity';
  private GET_AUDIT_LOGS = environment.BASE_URL + 'audit';

  constructor(private http: Http) {}

 /**
  *  GET | foglamp/audit/logcode
  */
  public getLogSource() {
    return this.http.get(this.GET_LOG_SOURCE)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }

  /**
  *  GET | foglamp/audit/severity
  */
  public getLogSeverity() {
    return this.http.get(this.GET_LOG_SEVERITY)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
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
    let params: URLSearchParams = new URLSearchParams();
    return this.http.get(this.GET_AUDIT_LOGS, { params: {
      limit: limit, skip: offset, source: source.toUpperCase(), severity: severity.toUpperCase()} })
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }
}
