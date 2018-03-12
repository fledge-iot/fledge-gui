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
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }

  /**
  * GET /foglamp/user/role
  * @param token
  */
  getRole() {
    return this.http.get(this.ROLE_URL)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }

  /**
   * DELETE  /foglamp/user/{id}
   * @param String token
   * @param Number id
   */
  deleteUser(id) {
    return this.http.delete(this.USER_URL + "/" + id)
    .map(response => response.json())
    .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }
}
