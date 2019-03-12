import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class SystemLogService {

  private SYSLOG_URL = environment.BASE_URL + 'syslog';

  constructor(private http: HttpClient) { }

  /**
   *  GET | foglamp/syslog
   */
  public getSysLogs(limit: Number = 0, offset: Number = 0, source: String, level: String) {
    let params = new HttpParams();
    params = params.set('limit', limit.toString());
    params = params.set('offset', offset.toString());
    if (level.toString() !== '') {
      params = params.set('level', level.toString().toUpperCase());
    }
    if (source) {
      params = params.set('source', source.toUpperCase());
    }
    return this.http.get(this.SYSLOG_URL, { params: params }).pipe(map(response => response),
    catchError(error => throwError(error)));
  }

}
