import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class NorthService {

  private GET_NORTH_TASKS = environment.BASE_URL + 'north';

  constructor(private http: HttpClient) { }

  /**
   *  GET | foglamp/north
   */
  public getNorthTasks() {
    return this.http.get(this.GET_NORTH_TASKS).pipe(
      map(response => response),
      catchError((error: Response) => observableThrowError(error)));
  }
}

