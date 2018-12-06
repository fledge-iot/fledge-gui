import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class PluginsService {

  private GET_INSTALLED_FILTER_PLUGINS = environment.BASE_URL + 'plugins/installed?type=filter&config=true';
  private ADD_FILTER = environment.BASE_URL + 'filter';

  constructor(private http: HttpClient) { }

  /**
   *  GET | plugins/installed?type=filter
   */
  public getInstalledFilterPlugins() {
    return this.http.get(this.GET_INSTALLED_FILTER_PLUGINS).pipe(
      map(response => response),
      catchError((error: Response) => observableThrowError(error)));
  }

  public saveFilter(payload) {
    return this.http.post(this.ADD_FILTER, payload).pipe(
      map(response => response),
      catchError((error: Response) => observableThrowError(error)));
  }

}
