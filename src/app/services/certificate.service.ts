import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { environment } from '../../environments/environment';

@Injectable()
export class CertificateService {

  private GET_LOG_SOURCE = environment.BASE_URL + 'audit/logcode';
  private GET_LOG_SEVERITY = environment.BASE_URL + 'audit/severity';
  private GET_AUDIT_LOGS = environment.BASE_URL + 'audit';

  constructor(private http: Http) { }

  
}
