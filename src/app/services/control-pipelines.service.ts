import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ControlPipelinesService {
  private CONTROL_URL = environment.BASE_URL + 'control';

  constructor(private http: HttpClient) { }
  getAllPipelines() {
    return this.http.get(`${this.CONTROL_URL}/pipeline`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  getPipelineByID(id) {
    return this.http.get(`${this.CONTROL_URL}/pipeline/${id}`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  createPipeline(payload: any) {
    return this.http.post(`${this.CONTROL_URL}/pipeline`, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  updatePipeline(id, payload: any) {
    return this.http.put(`${this.CONTROL_URL}/pipeline/${id}`, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  deletePipeline(id) {
    return this.http.delete(`${this.CONTROL_URL}/pipeline/${id}`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
  *   Get Source/Destination type list
  *   GET  | /fledge/control/lookup?type={source/destination}
  */
  getSourceDestinationTypeList(type) {
    let params = new HttpParams();
    params = params.set('type', type);
    return this.http.get(this.CONTROL_URL + '/' + 'lookup', { params: params }).pipe(
        map(response => response),
        catchError(error => throwError(error)));
  }

}
