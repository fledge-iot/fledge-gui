import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

export enum FilterPipelineType {
  Empty = 'empty',
  Simple = 'simple',
  Complex = 'complex'
}

@Injectable()
export class FilterService {

  private GET_INSTALLED_FILTER_PLUGINS = environment.BASE_URL + 'plugins/installed?type=filter&config=true';
  private FILTER_URL = environment.BASE_URL + 'filter';
  private CATEGORY_URL = environment.BASE_URL + 'category';

  constructor(private http: HttpClient) { }

  /**
   * Get installed filter plugins
   *
   * GET | plugins/installed?type=filter
   */
  public getInstalledFilterPlugins() {
    return this.http.get(this.GET_INSTALLED_FILTER_PLUGINS).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  Create filter
   *
   *  POST |  fledge/filter
   *  @param payload  {"name":"S3","plugin":"scale","filter_config":{}}
   */
  public saveFilter(payload) {
    return this.http.post(this.FILTER_URL, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }


  /**
   * Add filter pipeline
   *
   * PUT |  fledge/filter/{serviceName}/pipeline?allow_duplicates=true&append_filter=true
   * @param payload  {"pipeline":["S3"]}
   * @param serviceName service name
   */
  public addFilterPipeline(payload, serviceName) {
    return this.http.put(this.FILTER_URL + '/' + encodeURIComponent(serviceName)
      + '/pipeline?allow_duplicates=true&append_filter=true', payload).pipe(
        map(response => response),
        catchError(error => throwError(error)));
  }

  /**
   * Get filter pipeline
   *
   * GET | filter/{serviceName}/pipeline
   * @param serviceName
   */
  public getFilterPipeline(serviceName) {
    return this.http.get(this.FILTER_URL + '/' + encodeURIComponent(serviceName) + '/pipeline').pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   * Get filter configuration
   *
   * GET | category/{categoryName}
   * @param categoryName category name
   */
  public getFilterConfiguration(categoryName) {
    return this.http.get(this.CATEGORY_URL + '/' + encodeURIComponent(categoryName)).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   * Update filter pipeline
   *
   * PUT | filter/{serviceName}/pipeline?allow_duplicates=true&append_filter=false
   * @param payload  {"pipeline":["S3"]}
   * @param serviceName  service name
   */
  public updateFilterPipeline(payload, serviceName) {
    return this.http.put(this.FILTER_URL + '/' + encodeURIComponent(serviceName)
      + '/pipeline?allow_duplicates=true&append_filter=false', payload).pipe(
        map(response => response),
        catchError(error => throwError(error)));
  }

  /**
   * Delete filter
   *
   * DELETE | filter/{filterName}
   * @param filterName filter Name
   */
  public deleteFilter(filterName) {
    return this.http.delete(this.FILTER_URL + '/' + encodeURIComponent(filterName)).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   * Check if the array contains nested arrays (complex filter pipeline)
   * @param arr array to check
   * @returns true if array contains nested arrays, false otherwise
   */
  public isNestedArray(arr: any[]): boolean {
    return arr && arr.some(item => Array.isArray(item));
  }

  /**
   * Detect the filter pipeline type based on pipeline structure
   * @param filterPipeline the filter pipeline array
   * @returns FilterPipelineType enum value
   */
  public detectFilterPipelineType(filterPipeline: any[]): FilterPipelineType {
    if (!filterPipeline || filterPipeline.length === 0) {
      return FilterPipelineType.Empty;
    }
    
    if (this.isNestedArray(filterPipeline)) {
      return FilterPipelineType.Complex;
    }
    
    return FilterPipelineType.Simple;
  }
}
