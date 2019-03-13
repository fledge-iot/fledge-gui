import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class UserService {

  private USER_URL = environment.BASE_URL + 'user';
  private ADMIN_URL = environment.BASE_URL + 'admin';
  private ROLE_URL = environment.BASE_URL + 'user/role';
  constructor(private http: HttpClient) { }

  /**
   * Get all users
   *
   * GET | /foglamp/user
   *
   */
  getAllUsers() {
    return this.http.get(this.USER_URL).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   * Get user profile
   *
   * GET |  /foglamp/user?id={id}
   * @param string UID : id of logged in user
   *
   */
  getUser(uid) {
    let params = new HttpParams();
    params = params.set('id', uid);
    return this.http.get(this.USER_URL, { params: params }).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
  * get user role
  *
  *  GET |  /foglamp/user/role
  *
  */
  getRole() {
    return this.http.get(this.ROLE_URL).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   * delete user
   *
   * DELETE  | /foglamp/admin/{id}/delete
   *
   * @param Number id
   */
  deleteUser(id) {
    return this.http.delete(this.ADMIN_URL + '/' + id + '/delete').pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
  * Create user
  *
  * POST  | foglamp/admin/user
  *
  *  @param Object User  => {"username": "admin1", "password": "F0gl@mp!", "role_id": 1}
  */
  createUser(user) {
    return this.http.post(this.ADMIN_URL + '/user', user).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }


  /**
   * Update user role
   *
   * @param Object payload = > {"role_id": "1"}
   */
  updateRole(data) {
    const payload: any = {
      role_id: data.role_id
    };
    return this.http.put(this.ADMIN_URL + '/' + data.userId + '/reset', payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
  * change user password
  *
  * PUT  | /foglamp/user/{username}/password
  * @param Object payload  => {"current_password": "F0gl@mp!", "new_password": "F0gl@mp1"}
  */
  changePassword(payload, userName) {
    return this.http.put(this.USER_URL + '/' + userName + '/password', payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
    * change user password by admin
    *
    * PUT  | /foglamp/admin/{userId}/reset
    * @param Object payload => {"password": "F0gl@mp!"}
    */
  resetPassword(data) {
    const payload: any = {
      password: data.password
    };
    return this.http.put(this.ADMIN_URL + '/' + data.userId + '/reset', payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}

