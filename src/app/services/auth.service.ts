import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
    return this.http.post(this.LOGIN_URL, JSON.stringify({ username: username, password: password })).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  clear all active users sessions
    * @param string user id
    */
  clearAllSessions(id) {
    return this.http.put(this.LOGOUT_URL + id + '/logout', null).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  logout user
   */
  logout() {
    return this.http.put(this.LOGOUT_URL + 'logout', null).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}
