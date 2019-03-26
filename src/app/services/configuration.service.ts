import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class ConfigurationService {

  private CATEGORY_URL = environment.BASE_URL + 'category';
  constructor(private http: HttpClient) { }

  /**
   *   GET  | /foglamp/category
   */
  getCategories() {
    return this.http.get(this.CATEGORY_URL).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *   GET  | /foglamp/category?root=true&children=true
   */
  getCategoryWithChildren() {
    return this.http.get(this.CATEGORY_URL + '?root=true&children=true').pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
  /**
   *   GET  | /foglamp/category/{categoryName}
   */
  getCategory(categoryName) {
    categoryName = encodeURIComponent(categoryName);
    return this.http.get(this.CATEGORY_URL + '/' + categoryName).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *   GET  | /foglamp/category/{categoryName}/children
   */
  getChildren(categoryName) {
    categoryName = encodeURIComponent(categoryName);
    return this.http.get(this.CATEGORY_URL + '/' + categoryName + '/children').pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *   GET  | /foglamp/category
   *   @param root boolean type
   */
  getRootCategories() {
    let params = new HttpParams();
    params = params.set('root', 'true');
    return this.http.get(this.CATEGORY_URL, { params: params }).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
  *  PUT  | /foglamp/category/{categoryName}/{config_item}
  */
  saveConfigItem(categoryName: string, configItem: string, value: string, type: string) {
    let body = JSON.stringify({ 'value': value });
    if (type.toUpperCase() === 'JSON') {
      body = JSON.stringify({ 'value': JSON.parse(value) });
    }
    return this.http.put(this.CATEGORY_URL + '/' + encodeURIComponent(categoryName) + '/' + encodeURIComponent(configItem), body).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
  *  POST  | /foglamp/category/{categoryName}/{config_item}/upload
  */
  uploadFile(categoryName: string, configItem: string, fileToUpload) {
    return this.http.post(this.CATEGORY_URL + '/' + encodeURIComponent(categoryName) + '/'
    + encodeURIComponent(configItem) + '/upload', fileToUpload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
  *  GET  | /foglamp/category/{categoryName}/{config_item}
  */
  getConfigItem(categoryName: string, configItem: string) {
    return this.http.get(this.CATEGORY_URL + '/' + encodeURIComponent(categoryName) + '/' + encodeURIComponent(configItem)).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
  *  GET  | /foglamp/category/{categoryName}/children
  */
  getCategoryConfigChildren(categoryName: string) {
    categoryName = encodeURIComponent(categoryName);
    return this.http.get(this.CATEGORY_URL + '/' + categoryName + '/' + 'children').pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
  *  PUT  | /foglamp/category/{categoryName}
  */
  updateBulkConfiguration(categoryName, configItems) {
    categoryName = encodeURIComponent(categoryName);
    return this.http.put(this.CATEGORY_URL + '/' + categoryName, configItems).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}
