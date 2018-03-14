import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';
import { environment } from '../../environments/environment';

@Injectable()
export class StatisticsService {

  private GET_STATISTICS = environment.BASE_URL + 'statistics';
  private GET_STATISTICS_HISTORY = environment.BASE_URL + 'statistics/history?limit=20';

  constructor(private http: HttpClient) {}

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
  public getStatisticsHistory() {
    return this.http.get(this.GET_STATISTICS_HISTORY)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }
}
