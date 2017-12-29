import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { environment } from '../../environments/environment';

@Injectable()
export class ConfigurationService {
    // private instance variable to hold base url
    private GET_CATEGORIES_URL = environment.BASE_URL + 'categories';
    private GET_CATEGORY_URL = environment.BASE_URL + 'category';

    constructor(private http: Http) { }

    /**
     *   GET  | /foglamp/categories
     */
    getCategories() {
        return this.http.get(this.GET_CATEGORIES_URL)
            .map(response => response.json())
            .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
    }

    /**
     *   GET  | /foglamp/category/{category_name}
     */
    getCategory(category_name) {
        return this.http.get(this.GET_CATEGORY_URL + '/' + category_name)
            .map(response => response.json())
            .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
    }

    /**
    *  PUT  | /foglamp/category/{category_name}/{config_item}
    */
    editConfigItem(category_name: string, config_item: string, value: string) {
        let body = JSON.stringify({ 'value': value });
        return this.http.put(this.GET_CATEGORY_URL + '/' + category_name + '/' + config_item, body)
            .map(response => response.json())
            .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
    }
}
