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
   *  GET | fledge/syslog
   */
  public getSysLogs(source: String, level: String, limit: Number = 0) {
    let params = new HttpParams();
    params = params.set('limit', limit.toString());
    if (level.toString() !== '') {
      params = params.set('level', level.toString());
    }
    if (source) {
      params = params.set('source', encodeURIComponent(source.toString()));
    }
    return this.http.get(this.SYSLOG_URL, { params: params }).pipe(map(response => response),
    catchError(error => throwError(error)));
  }

}
