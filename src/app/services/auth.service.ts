import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthService {
  // private instance variable to hold base url
  private LOGIN_URL = environment.BASE_URL + 'login';
  private LOGOUT_URL = environment.BASE_URL;

  constructor(private http: HttpClient) { }

  /**
   *  Login into system
   * @param username  User username
   * @param password  User Password
   */
  login(username: string, password: string) {
    return this.http.post(this.LOGIN_URL, JSON.stringify({ username: username, password: password }))
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  clear all active users sessions
    * @param string user id
    */
  clearAllSessions(id) {
    return this.http.put(this.LOGOUT_URL + id + '/logout', null)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  logout user
   */
  logout() {
    return this.http.put(this.LOGOUT_URL + 'logout', null)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }
}
