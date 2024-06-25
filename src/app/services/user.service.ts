import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { PingService } from './ping.service';
import { SharedService } from './shared.service';

@Injectable()
export class UserService {

  private USER_URL = environment.BASE_URL + 'user';
  private ADMIN_URL = environment.BASE_URL + 'admin';
  private ROLE_URL = environment.BASE_URL + 'user/role';
  constructor(private http: HttpClient,
    private sharedService: SharedService,
    private pingService: PingService) { }

  /**
   * Get all users
   *
   * GET | /fledge/user
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
   * GET |  /fledge/user?id={id}
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
  *  GET |  /fledge/user/role
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
   * DELETE  | /fledge/admin/{user_id}/delete
   *
   * @param Number id
   */
  deleteUser(id) {
    return this.http.delete(this.ADMIN_URL + '/' + id + '/delete').pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   * enable/disable user
   *
   * PUT  | /fledge/admin/{user_id}/enable
   *
   * @param payload = > {"enabled": boolean}
   */
  enableUser(id, payload) {
    return this.http.put(this.ADMIN_URL + '/' + id + '/enable', payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   * Unblock user
   * PUT  | /fledge/admin/{user_id}/unblock
   */
  unblockUser(id: string) {
    return this.http.put(this.ADMIN_URL + '/' + id + '/unblock', null).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
  * Create user
  *
  * POST  | fledge/admin/user
  *
  *  @param Object User  => {"username": "admin1", "password": "F0gl@mp!", "roleId": 1}
  */
  createUser(user) {
    delete user['confirmPassword'];
    return this.http.post(this.ADMIN_URL + '/user', user).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }


  /**
   * Update user role
   *
   * @param Object payload = > {"roleId": "1"}
   */
  updateRole(payload: any) {
    return this.http.put(this.ADMIN_URL + '/' + payload.userId + '/reset', payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  updateUser(data) {
    const payload: any = {
      access_method: data.access_method,
      description: data.description,
      real_name: data.real_name
    };
    return this.http.put(this.ADMIN_URL + '/' + data.userId, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  updateMe(data) {
    const payload: any = {
      real_name: data.real_name
    };
    return this.http.put(this.USER_URL, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
  * change user password
  *
  * PUT  | /fledge/user/{userId}/password
  * @param Object payload  => {"current_password": "F0gl@mp!", "new_password": "F0gl@mp1"}
  */
  changePassword(payload, userId) {
    return this.http.put(this.USER_URL + '/' + userId + '/password', payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
    * change user password by admin
    *
    * PUT  | /fledge/admin/{userId}/reset
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

  setUserSession(data: any) {
    sessionStorage.setItem('token', data['token']);
    sessionStorage.setItem('uid', data['uid']);
    sessionStorage.setItem('isAdmin', JSON.stringify(data['admin']));
  }

  emitUser(user: any) {
    this.sharedService.isUserLoggedIn.next({
      'loggedIn': true,
      'userName': user['userName'],
      'isAuthOptional': JSON.parse(sessionStorage.getItem('LOGIN_SKIPPED'))
    });
    // save role id and user name in session storage
    sessionStorage.setItem('roleId', user['roleId']);
    this.sharedService.dataViewUserSubject.next(user['roleId']);
    sessionStorage.setItem('userName', user['userName']);
  }

}

