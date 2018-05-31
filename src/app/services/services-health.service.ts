import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';
import { InterceptorSkipHeader } from '../services/http.request.interceptor';
import 'rxjs/add/operator/timeout';

@Injectable()
export class ServicesHealthService {
  private GET_PING_URL = environment.BASE_URL + 'ping';
  private FOGLAMP_SHUTDOWN_URL = environment.BASE_URL + 'shutdown';
  private GET_SERVICES_URL = environment.BASE_URL + 'service';
  private REQUEST_TIMEOUT_INTERVAL = 5000;

  constructor(private http: HttpClient) { }

  /**
     *  GET  | /foglamp/ping
     */
  pingService() {
    return this.http.get(this.GET_PING_URL)
      .timeout(this.REQUEST_TIMEOUT_INTERVAL)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  PUT  | /foglamp/shutdown
   */
  shutdown() {
    return this.http.put(this.FOGLAMP_SHUTDOWN_URL, null)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  GET  | /foglamp/service
   */
  getAllServices() {
    return this.http.get(this.GET_SERVICES_URL)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  POST  | /foglamp/service/shutdown
   */
  shutDownService(svcInfo) {
    const port = svcInfo.port;
    const protocol = svcInfo.protocol;
    const headers = new HttpHeaders().set(InterceptorSkipHeader, '');
    const baseUrl = this.GET_SERVICES_URL;
    const serviceUrl = baseUrl.replace(/^https?/i, protocol);
    const url = new URL(serviceUrl);
    url.port = port;
    return this.http.post(String(url) + '/shutdown', null)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }
}
