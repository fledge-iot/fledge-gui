import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { environment } from '../../environments/environment';

@Injectable()
export class DiscoveryService {

  constructor(private http: Http) { }

  /**
   *  GET  | /foglamp/discover
   */
  discover() {
    const serviceDiscoveryUrl = localStorage.getItem('DISCOVERY_SERVICE_URL');
    return this.http.get(serviceDiscoveryUrl)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error));
  }
}


