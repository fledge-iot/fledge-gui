import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';

@Injectable()
export class CertificateService {

  private CERTIFICATE_URL = environment.BASE_URL + 'certificate';

  constructor(private http: HttpClient) { }

  /**
   *  GET | /foglamp/certificate
   */
  public getCertificates() {
    return this.http.get(this.CERTIFICATE_URL)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  DELETE | /foglamp/certificate/{name}
   */
  public deleteCertificate(cert_name) {
    return this.http.delete(this.CERTIFICATE_URL + '/' + cert_name)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  POST | /foglamp/certificate
   */
  public uploadCertificate(payload) {
    return this.http.post(this.CERTIFICATE_URL,  payload)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }
}
