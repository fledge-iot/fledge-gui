import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';

@Injectable()
export class UserService {

  private USER_URL = environment.BASE_URL + 'user';
  private ROLE_URL = environment.BASE_URL + 'user/role'
  constructor(private http: HttpClient) { }

  /**
   * Get all users 
   * 
   * GET | /foglamp/user
   * 
   */
  getAllUsers() {
    return this.http.get(this.USER_URL)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
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
    params = params.set('id', uid)
    return this.http.get(this.USER_URL, { params: params })
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
  * get user role
  * 
  *  GET |  /foglamp/user/role
  *
  */
  getRole() {
    return this.http.get(this.ROLE_URL)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   * DELETE  /foglamp/user/{id}
   *
   * @param Number id
   */
  deleteUser(id) {
    return this.http.delete(this.USER_URL + "/" + id)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
  * Create user
  * 
  * POST  | foglamp/user
  *
  */
  createUser(user) {
    return this.http.post(this.USER_URL, user)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
  * Update user 
  * 
  * PUT  | /foglamp/user/{id}
  * @param Object payload 
  */
  updateUser(payload) {
    return this.http.put(this.USER_URL + "/" + payload.userId, payload)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
  * change user password 
  * 
  * PUT  | /foglamp/user/{username}/password
  * @param Object payload 
  */
 changePassword(payload, userName) {
  return this.http.put(this.USER_URL + "/" + userName + "/password", payload)
    .map(response => response)
    .catch((error: Response) => Observable.throw(error));
}
}
