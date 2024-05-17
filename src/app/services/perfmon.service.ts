import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PerfMonService {

  private GET_MONITORS = environment.BASE_URL + 'monitors';

  constructor(private http: HttpClient) { }


  public getPerformanceMonitors() {
    return this.http.get(this.GET_MONITORS).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}
