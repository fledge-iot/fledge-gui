import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AclService {
  private ACL_URL = environment.BASE_URL + 'ACL';

  constructor(private http: HttpClient) { }
  fetchAllACL() {
    return this.http.get(this.ACL_URL).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  fetchAclByName(name: string) {
    return this.http.get(`${this.ACL_URL}/${encodeURIComponent(name)}`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  addACL(payload: any) {
    return this.http.post(this.ACL_URL, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  updateACL(name: string, payload: any) {
    return this.http.put(`${this.ACL_URL}/${encodeURIComponent(name)}`, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  deleteACL(name: string) {
    return this.http.delete(`${this.ACL_URL}/${encodeURIComponent(name)}`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

}
