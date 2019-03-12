import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class SchedulesService {

  private GET_SCHEDULE_TYPE = environment.BASE_URL + 'schedule/type';
  private GET_SCHEDULE_PROCESS = environment.BASE_URL + 'schedule/process';
  private SCHEDULE_URL = environment.BASE_URL + 'schedule';
  private CREATE_TASK = environment.BASE_URL + 'scheduled/task';

  private TASKS_URL = environment.BASE_URL + 'task';
  private LATEST_TASK_URL = environment.BASE_URL + 'task/latest';

  constructor(private http: HttpClient) { }

  /**
   *  GET | foglamp/schedule/type
   */
  public getScheduleType() {
    return this.http.get(this.GET_SCHEDULE_TYPE).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }


  /**
   *  GET | /foglamp/schedule
   */
  public getSchedules() {
    return this.http.get(this.SCHEDULE_URL).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  GET | /foglamp/schedule/{schedule_id}
   */
  public getSchedule(schedule_id) {
    return this.http.get(this.SCHEDULE_URL + '/' + schedule_id).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   * Create schedule
   *
   * POST | /foglamp/schedule
   *
   */
  public createSchedule(payload: any) {
    return this.http.post(this.SCHEDULE_URL, JSON.stringify(payload)).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
    * Update schedule
    *
    * PUT | /foglamp/schedule/{schedule_id}
    *
    */
  public updateSchedule(schedule_id, payload: any) {
    return this.http.put(this.SCHEDULE_URL + '/' + schedule_id, JSON.stringify(payload)).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  GET | /foglamp/schedule/process
   */
  public getScheduledProcess() {
    return this.http.get(this.GET_SCHEDULE_PROCESS).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  PUT | /foglamp/schedule/{schedule_id}/enable
   */
  public enableSchedule(id) {
    return this.http.put(this.SCHEDULE_URL + '/' + id + '/' + 'enable', null).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  PUT | /foglamp/schedule/{schedule_id}/disable
   */
  public disableSchedule(id) {
    return this.http.put(this.SCHEDULE_URL + '/' + id + '/' + 'disable', null).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  PUT | /foglamp/schedule/enable
   */
  public enableScheduleByName(scheduleName) {
    return this.http.put(this.SCHEDULE_URL + '/enable', { 'schedule_name': scheduleName }).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  PUT | /foglamp/schedule/disable
   */
  public disableScheduleByName(scheduleName) {
    return this.http.put(this.SCHEDULE_URL + '/disable', { 'schedule_name': scheduleName }).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  GET | /foglamp/task/latest
   */
  public getLatestTask() {
    return this.http.get(this.LATEST_TASK_URL).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  PUT | /foglamp/task/{task_id}/cancel
   */
  public cancelTask(id) {
    return this.http.put(this.TASKS_URL + '/' + id + '/cancel', null).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   * Create a task
   *
   * POST | /foglamp/scheduled/task
   *
   */
  public createScheduledTask(payload: any) {
    return this.http.post(this.CREATE_TASK, JSON.stringify(payload)).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}
