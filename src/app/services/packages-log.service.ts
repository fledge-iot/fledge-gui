import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class PackagesLogService {
  private PACKAGE_LOG_URL = environment.BASE_URL + 'package/log';

  constructor(private http: HttpClient) { }

  /**
   *  GET | foglamp/package/log
   */
  public getPackageLogs() {
    return this.http.get(this.PACKAGE_LOG_URL).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  GET | foglamp/package/log/{logFile}
   */
  public async getLog(logFile: string): Promise<Blob> {
    const file = await this.http.get<Blob>(
      this.PACKAGE_LOG_URL + '/' + logFile,
      { responseType: 'blob' as 'json' }).toPromise();
    return file;
  }
}
