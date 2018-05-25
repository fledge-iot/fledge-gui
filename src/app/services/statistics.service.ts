import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';

@Injectable()
export class StatisticsService {

  private GET_STATISTICS = environment.BASE_URL + 'statistics';
  private GET_STATISTICS_HISTORY = environment.BASE_URL + 'statistics/history';

  constructor(private http: HttpClient) { }

  /**
   *    GET  | /foglamp/statistics
   */
  public getStatistics() {
    return this.http.get(this.GET_STATISTICS)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  GET | /foglamp/statistics/history
   */
  public getStatisticsHistory(limit) {
    let params = new HttpParams();
    params = params.append('limit', limit);
    return this.http.get(this.GET_STATISTICS_HISTORY, { params: params })
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }
}
