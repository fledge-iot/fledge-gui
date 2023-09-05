import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ControlAPIFlowService {
  private CONTROL_URL = environment.BASE_URL + 'control';

  constructor(private http: HttpClient) { }
  getAllAPIFlow() {
    return this.http.get(`${this.CONTROL_URL}/manage`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  getAPIFlow(name) {
    return this.http.get(`${this.CONTROL_URL}/manage/${name}`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  createAPIFlow(payload: any) {
    return this.http.post(`${this.CONTROL_URL}/manage`, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  updateAPIFlow(name, payload: any) {
    return this.http.put(`${this.CONTROL_URL}/manage/${name}`, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  deleteAPIFlow(name) {
    return this.http.delete(`${this.CONTROL_URL}/manage/${name}`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  requestAPIFlow(name, payload: any) {
    return this.http.put(`${this.CONTROL_URL}/request/${name}`, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}
