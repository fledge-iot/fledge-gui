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
  // private CATEGORY_URL = environment.BASE_URL + 'category';

  constructor(private http: HttpClient) { }


  fetchControlServiceScripts() {
    return this.http.get(this.CONTROL_SERVICE_URL).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  fetchControlServiceScriptByName(name: string) {
    return this.http.get(`${this.CONTROL_SERVICE_URL}/${name}`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}
