import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { environment } from '../../environments/environment';

@Injectable()
export class ConfigurationService {
    // private instance variable to hold base url
    private GET_CATEGORY_URL = environment.BASE_URL + 'category';

    constructor(private http: Http) { }

    /**
     *   GET  | /foglamp/category
     */
    getCategories() {
        return this.http.get(this.GET_CATEGORY_URL)
            .map(response => response.json())
            .catch((error: Response) => Observable.throw(error));
    }

    /**
     *   GET  | /foglamp/category/{category_name}
     */
    getCategory(category_name) {
        return this.http.get(this.GET_CATEGORY_URL + '/' + category_name)
            .map(response => response.json())
            .catch((error: Response) => Observable.throw(error));
    }

    /**
    *  PUT  | /foglamp/category/{category_name}/{config_item}
    */
    saveConfigItem(category_name: string, config_item: string, value: string, type: string) {
        let body = JSON.stringify({ 'value': value });
        if (type.toUpperCase() === 'JSON') {
            body = JSON.stringify({ 'value': JSON.parse(value) });
        }
        return this.http.put(this.GET_CATEGORY_URL + '/' + category_name + '/' + config_item, body)
            .map(response => response.json())
            .catch((error: Response) => Observable.throw(error));
    }
}
