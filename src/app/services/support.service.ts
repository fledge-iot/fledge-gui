import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';

@Injectable()
export class SupportService {
  public SUPPORT_BUNDLE_URL = environment.BASE_URL + 'support';

  constructor(private http: HttpClient) { }

  /**
   *  GET | /foglamp/support
   */
  public get() {
    return this.http.get(this.SUPPORT_BUNDLE_URL)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  POST | /foglamp/support
   */
  public post() {
    return this.http.post(this.SUPPORT_BUNDLE_URL, null)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }
}
