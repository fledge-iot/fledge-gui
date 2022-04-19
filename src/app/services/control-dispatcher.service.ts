import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ControlDispatcherService {

  private CONTROL_SERVICE_URL = environment.BASE_URL + 'control/script';
  private ACL_URL = environment.BASE_URL + 'ACL';

  constructor(private http: HttpClient) { }

  fetchControlServiceScripts() {
    return this.http.get(this.CONTROL_SERVICE_URL).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  fetchControlServiceScriptByName(name: string) {
    return this.http.get(`${this.CONTROL_SERVICE_URL}/${encodeURIComponent(name)}`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  addControlScript(payload: any) {
    return this.http.post(`${this.CONTROL_SERVICE_URL}`, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  updateScript(name: string, payload: any) {
    return this.http.put(`${this.CONTROL_SERVICE_URL}/${encodeURIComponent(name)}`, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  deleteScript(name: string) {
    return this.http.delete(`${this.CONTROL_SERVICE_URL}/${encodeURIComponent(name)}`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

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

  addControlScheduleTask(scriptName, payload) {
    return this.http.post(`${this.CONTROL_SERVICE_URL}/${scriptName}/schedule`, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

}
