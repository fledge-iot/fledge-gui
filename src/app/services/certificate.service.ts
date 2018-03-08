import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { environment } from '../../environments/environment';

@Injectable()
export class CertificateService {

  private GET_CERTIFICATES = environment.BASE_URL + 'certificate';

  constructor(private http: Http) { }

  /**
   *  GET | /foglamp/certificate
   */
  public getcertificates() {
    return this.http.get(this.GET_CERTIFICATES)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  DELETE | /foglamp/certificate/{name}
   */
  public deleteCertificate(cert_name) {
    return this.http.delete(this.GET_CERTIFICATES + '/' + cert_name)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error));
  }
  
}
