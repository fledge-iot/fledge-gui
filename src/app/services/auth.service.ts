import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable, Subject } from 'rxjs/Rx';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthService {
  // private instance variable to hold base url
  private LOGIN_URL = environment.BASE_URL + 'login';
  private LOGOUT_URL = environment.BASE_URL + 'logout';

  constructor(private http: Http) {}

  /**
   *  Login into system
   * @param username  User username
   * @param password  User Password
   */
  login(username: string, password: string) {
    return this.http.post(this.LOGIN_URL, JSON.stringify({ username: username, password: password }))
      .map(response =>response.json())
      .catch((error: Response) => Observable.throw(error));
  }

  /**
    * Get assets data
    * @param token
    */
  logout(token: string) {
    let headers = new Headers({ 'content-type': 'application/json' });
    headers.append('authorization', token);
    return this.http.put(this.LOGOUT_URL, null)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error));
  }
}
