import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';
import { environment } from '../../environments/environment';
import { InterceptorSkipHeader } from '../services/http.request.interceptor';

@Injectable()
export class DiscoveryService {

  constructor(private http: HttpClient) { }

  /**
   *  GET  | /foglamp/discover
   */
  discover() {
    const headers = new HttpHeaders().set(InterceptorSkipHeader, '');
    const serviceDiscoveryUrl = localStorage.getItem('DISCOVERY_SERVICE_URL');
    return this.http.get(serviceDiscoveryUrl)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }
}


