import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ControlFlowAPIService {
  private CONTROL_URL = environment.BASE_URL + 'control';

  constructor(private http: HttpClient) { }
  getAllFlowAPI() {
    return this.http.get(`${this.CONTROL_URL}/manage`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  getFlowAPI(name) {
    return this.http.get(`${this.CONTROL_URL}/manage/${name}`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  createFlowAPI(payload: any) {
    return this.http.post(`${this.CONTROL_URL}/manage`, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  updateFlowAPI(name, payload: any) {
    return this.http.put(`${this.CONTROL_URL}/manage/${name}`, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  updateRequestFlowAPI(name, payload: any) {
    return this.http.put(`${this.CONTROL_URL}/request/${name}`, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  deleteFlowAPI(name) {
    return this.http.delete(`${this.CONTROL_URL}/manage/${name}`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

}
