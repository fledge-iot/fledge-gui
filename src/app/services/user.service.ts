import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable, Subject } from 'rxjs/Rx';
import { environment } from '../../environments/environment';


@Injectable()
export class UserService {

  private USER_URL = environment.BASE_URL + 'user';
  private ROLE_URL = environment.BASE_URL + 'user/role'

  constructor(private http: Http) { }

  /**
   * GET /foglamp/user
   * @param token
   */
  getWhoAmi(token: string) {
    let headers = new Headers({ 'content-type': 'application/json' });
    headers.append('authorization', token);
    let options = new RequestOptions({ headers: headers });
    return this.http.get(this.USER_URL, options)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error));
  }

  /**
  * GET /foglamp/user/role
  * @param token
  */
  getRole() {
    return this.http.get(this.ROLE_URL)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   * DELETE  /foglamp/user/{id}
   * @param String token
   * @param Number id
   */
  deleteUser(id) {
    return this.http.delete(this.USER_URL + "/" + id)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error));
  }

  /**
  * POST  /foglamp/user/{id}
  * @param String token
  * @param Number id
  */
  createUser(user, token) {
    let headers = new Headers({ 'content-type': 'application/json' });
    headers.append('authorization', token);
    let options = new RequestOptions({ headers: headers });
    return this.http.post(this.USER_URL, user)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error));
  }

  /**
  * PUT  /foglamp/user/{id}
  * @param String token
  * @param Object payload 
  */
 updateUser(payload, token) {
  let headers = new Headers({ 'content-type': 'application/json' });
  headers.append('authorization', token);
  let options = new RequestOptions({ headers: headers });
  return this.http.put(this.USER_URL + "/" + payload.user_id, payload)
    .map(response => response.json())
    .catch((error: Response) => Observable.throw(error));
}
}
