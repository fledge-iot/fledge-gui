import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs/Rx';
import { environment } from '../../environments/environment';

@Injectable()
export class UserService {

  private USER_URL = environment.BASE_URL + 'user';
  private ROLE_URL = environment.BASE_URL + 'user/role'
  constructor(private http: HttpClient) { }

  /**
   * GET /foglamp/user
   * @param token
   */
  getUser(token: string, uid = '0') {
    let params = new HttpParams();
    params = params.set('id', uid)
    return this.http.get(this.USER_URL, { params: params })
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
  * GET /foglamp/user/role
  * @param token
  */
  getRole() {
    return this.http.get(this.ROLE_URL)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   * DELETE  /foglamp/user/{id}
   * @param String token
   * @param Number id
   */
  deleteUser(id) {
    return this.http.delete(this.USER_URL + "/" + id)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
  * POST  /foglamp/user/{id}
  * @param String token
  * @param Number id
  */
  createUser(user, token) {
    return this.http.post(this.USER_URL, user)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
  * PUT  /foglamp/user/{id}
  * @param String token
  * @param Object payload 
  */
  updateUser(payload, token) {
    return this.http.put(this.USER_URL + "/" + payload.user_id, payload)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }
}
