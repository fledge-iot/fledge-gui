import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class SystemAlertService {
//   public SUPPORT_BUNDLE_URL = environment.BASE_URL + 'support';

  constructor(private http: HttpClient) { }

  /**
   *  GET | /fledge/support
   */
  public getAlerts() {
    return this.http.get(environment.BASE_URL + '/alert').pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  POST | /fledge/support
   */
//   public post() {
//     return this.http.post(this.SUPPORT_BUNDLE_URL, null).pipe(
//       map(response => response),
//       catchError(error => throwError(error)));
//   }


//   public async downloadSupportBundle(bundle): Promise<Blob> {
//     const file = await this.http.get<Blob>(
//       this.SUPPORT_BUNDLE_URL + '/' + bundle,
//       { responseType: 'blob' as 'json' }).toPromise();
//     return file;
//   }
}
