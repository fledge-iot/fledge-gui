import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class FilterService {

  private GET_INSTALLED_FILTER_PLUGINS = environment.BASE_URL + 'plugins/installed?type=filter&config=true';
  private FILTER_URL = environment.BASE_URL + 'filter';
  private CATEGORY_URL = environment.BASE_URL + 'category';

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
    return this.http.post(this.FILTER_URL, payload).pipe(
      map(response => response),
      catchError((error: Response) => observableThrowError(error)));
  }

  public addFilterPipeline(payload, serviceName) {
    return this.http.put(this.FILTER_URL + '/' + encodeURIComponent(serviceName)
      + '/pipeline?allow_duplicates=true&append_filter=true', payload).pipe(
        map(response => response),
        catchError((error: Response) => observableThrowError(error)));
  }

  public getFilterPipeline(serviceName) {
    return this.http.get(this.FILTER_URL + '/' + encodeURIComponent(serviceName) + '/pipeline').pipe(
      map(response => response),
      catchError((error: Response) => observableThrowError(error)));
  }

  public getFilterConfiguration(categoryName) {
    return this.http.get(this.CATEGORY_URL + '/' + encodeURIComponent(categoryName)).pipe(
      map(response => response),
      catchError((error: Response) => observableThrowError(error)));
  }

  public updateFilterPipeline(payload, serviceName) {
    return this.http.put(this.FILTER_URL + '/' + encodeURIComponent(serviceName)
      + '/pipeline?allow_duplicates=true&append_filter=false', payload).pipe(
        map(response => response),
        catchError((error: Response) => observableThrowError(error)));
  }

  public deleteFilter(filterName) {
    return this.http.delete(this.FILTER_URL + '/' + encodeURIComponent(filterName)).pipe(
        map(response => response),
        catchError((error: Response) => observableThrowError(error)));
  }
}
