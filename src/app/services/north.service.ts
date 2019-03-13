import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class NorthService {

  private GET_NORTH_TASKS = environment.BASE_URL + 'north';
  private DELETE_TASK = environment.BASE_URL + 'scheduled/task';

  constructor(private http: HttpClient) { }

  /**
   *  GET | foglamp/north
   */
  public getNorthTasks() {
    return this.http.get(this.GET_NORTH_TASKS).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  DELETE | /foglamp/scheduled/task/{taskName}
   */
  public deleteTask(taskName) {
    return this.http.delete(this.DELETE_TASK + '/' + encodeURIComponent(taskName)).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}

