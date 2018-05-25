import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';

@Injectable()
export class ConfigurationService {
    // private instance variable to hold base url
    private CATEGORY_URL = environment.BASE_URL + 'category';
    constructor(private http: HttpClient) { }

    /**
     *   GET  | /foglamp/category
     */
    getCategories() {
        return this.http.get(this.CATEGORY_URL)
            .map(response => response)
            .catch((error: Response) => Observable.throw(error));
    }

    /**
     *   GET  | /foglamp/category/{category_name}
     */
    getCategory(category_name) {
        return this.http.get(this.CATEGORY_URL + '/' + category_name)
            .map(response => response)
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
        return this.http.put(this.CATEGORY_URL + '/' + category_name + '/' + config_item, body)
            .map(response => response)
            .catch((error: Response) => Observable.throw(error));
    }

    /**
    *  POST  | /foglamp/category/{category_name}/{config_item}
    */
    addNewConfigItem(configItemData, category_name: string, config_item: string) {
        return this.http.post(this.CATEGORY_URL + '/' + category_name + '/' + config_item, configItemData)
            .map(response => response)
            .catch((error: Response) => Observable.throw(error));
    }
}
