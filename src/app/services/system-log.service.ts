import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';

@Injectable()
export class SystemLogService {

  private SYSLOG_URL = environment.BASE_URL + 'syslog';

  constructor(private http: HttpClient) { }

  /**
   *  GET | foglamp/syslog
   */
  public getSysLogs(limit: Number = 0, offset: Number = 0, source: String) {
    let params = new HttpParams();
    params = params.set('limit', limit.toString());
    params = params.set('offset', offset.toString());
    if (source) {
      params = params.set('source', source.toUpperCase());
    }
    return this.http.get(this.SYSLOG_URL, { params: params }).map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

}
