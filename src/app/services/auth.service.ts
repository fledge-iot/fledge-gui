import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable, Subject } from 'rxjs/Rx';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthService {
  // private instance variable to hold base url
  private LOGIN_URL = environment.BASE_URL + 'login';
  private LOGOUT_URL = environment.BASE_URL + 'logout';
  private USER_DATA_URL = environment.BASE_URL + 'user';

  constructor(private http: Http) {}

  /**
   *  Login into system
   * @param username  User username
   * @param password  User Password
   */
  login(username: string, password: string) {
    return this.http.post(this.LOGIN_URL, JSON.stringify({ username: username, password: password }))
      .map(response =>response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }

  /**
   * Get SignedIn user details
   * @param token
   */
  getWhoAmi(token: string) {
    let headers = new Headers({ 'content-type': 'application/json' });
    headers.append('authorization', token);
    let options = new RequestOptions({ headers: headers });
    return this.http.get(this.USER_DATA_URL, options)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }

  /**
    * Get assets data
    * @param token
    */
  logout(token: string) {
    return this.http.put(this.LOGOUT_URL, JSON.stringify({ token: token }))
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }
}
