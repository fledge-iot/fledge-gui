import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ControlDispatcherService {

  private CONTROL_SERVICE_URL = environment.BASE_URL + 'control/script';


  public triggerRefreshEvent: BehaviorSubject<string> = new BehaviorSubject<any>('');

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

  addControlScheduleTask(scriptName, payload) {
    return this.http.post(`${this.CONTROL_SERVICE_URL}/${encodeURIComponent(scriptName)}/schedule`, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

}
