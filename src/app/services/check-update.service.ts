import { Injectable } from '@angular/core';
import { BehaviorSubject, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable()
export class CheckUpdateService {
  private CHECK_UPDATE_INTERVAL = 604800000;
  checkUpdateResponse: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  constructor(private http: HttpClient) { }

  /**
   *  GET  | /fledge/update
   */
   checkUpdate(): Promise<any> {
    return this.http.get(environment.BASE_URL + 'update')
    .pipe(timeout(this.CHECK_UPDATE_INTERVAL))
    .toPromise()
    .then((res) => {
      this.checkUpdateResponse.next(true);
      return Promise.resolve(res);
      })
    .catch(err => {
      if (err.status === 0 || err.status === 404) {
        this.checkUpdateResponse.next(false);
      } else {
        this.checkUpdateResponse.next(true);
      }
      return Promise.reject(err);
    });
  }

  update() {
    return this.http.put(environment.BASE_URL + 'update', null).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}
