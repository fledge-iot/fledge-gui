import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class ConfigurationService {
    // private instance variable to hold base url
    private CATEGORY_URL = environment.BASE_URL + 'category';
    constructor(private http: HttpClient) { }

    /**
     *   GET  | /foglamp/category/{category_name}
     */
    getCategory(category_name) {
        return this.http.get(this.CATEGORY_URL + '/' + category_name).pipe(
            map(response => response),
            catchError((error: Response) => observableThrowError(error)));
    }

    /**
     *   GET  | /foglamp/category/{category_name}/children
     */
    getChildren(category_name) {
        return this.http.get(this.CATEGORY_URL + '/' + category_name + '/children').pipe(
            map(response => response),
            catchError((error: Response) => observableThrowError(error)));
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
            catchError((error: Response) => observableThrowError(error)));
    }

    /**
    *  PUT  | /foglamp/category/{category_name}/{config_item}
    */
    saveConfigItem(category_name: string, config_item: string, value: string, type: string) {
        let body = JSON.stringify({ 'value': value });
        if (type.toUpperCase() === 'JSON') {
            body = JSON.stringify({ 'value': JSON.parse(value) });
        }
        return this.http.put(this.CATEGORY_URL + '/' + category_name + '/' + config_item, body).pipe(
            map(response => response),
            catchError((error: Response) => observableThrowError(error)));
    }

    /**
    *  POST  | /foglamp/category/{category_name}/{config_item}
    */
    addNewConfigItem(configItemData, category_name: string, config_item: string) {
        return this.http.post(this.CATEGORY_URL + '/' + category_name + '/' + config_item, configItemData).pipe(
            map(response => response),
            catchError((error: Response) => observableThrowError(error)));
    }

    /**
    *  POST  | /foglamp/category/{category_name}/children
    */
    addChild(category_name, child) {
        return this.http.post(this.CATEGORY_URL + '/' + category_name + '/children', JSON.stringify({ children: child })).pipe(
            map(response => response),
            catchError((error: Response) => observableThrowError(error)));
    }
}
