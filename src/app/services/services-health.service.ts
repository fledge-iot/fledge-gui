import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';
import { environment } from '../../environments/environment';
import { InterceptorSkipHeader } from '../services/http.request.interceptor';

@Injectable()
export class ServicesHealthService {
  private GET_PING_URL = environment.BASE_URL + 'ping';
  private FOGLAMP_SHUTDOWN_URL = environment.BASE_URL + 'shutdown';
  private GET_SERVICES_URL = environment.BASE_URL + 'service';
  constructor(private http: HttpClient) { }

  /**
     *  GET  | /foglamp/ping
     */
  pingService() {
    return this.http.get(this.GET_PING_URL)
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
  shutDownService(port) {
    const headers = new HttpHeaders().set(InterceptorSkipHeader, '');
    const url = new URL(this.GET_SERVICES_URL);
    url.port = port;
    return this.http.post(String(url) + "/shutdown", null)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }
}
