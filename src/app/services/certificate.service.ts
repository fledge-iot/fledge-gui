import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { environment } from '../../environments/environment';

@Injectable()
export class CertificateService {

  private CERTIFICATE_URL = environment.BASE_URL + 'certificate';

  constructor(private http: Http) { }

  /**
   *  GET | /foglamp/certificate
   */
  public getcertificates() {
    return this.http.get(this.CERTIFICATE_URL)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  DELETE | /foglamp/certificate/{name}
   */
  public deleteCertificate(cert_name) {
    return this.http.delete(this.CERTIFICATE_URL + '/' + cert_name)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  POST | /foglamp/certificate
   */
  public uploadCertificate(payload) {
    return this.http.post(this.CERTIFICATE_URL,  payload)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error));
  }
}
