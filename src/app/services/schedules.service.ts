import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';

@Injectable()
export class SchedulesService {

  private GET_SCHEDULE_TYPE = environment.BASE_URL + 'schedule/type';
  private GET_SCHEDULE_PROCESS = environment.BASE_URL + 'schedule/process';
  private GET_SCHEDULE = environment.BASE_URL + 'schedule';

  private TASKS_URL = environment.BASE_URL + 'task';
  private LATEST_TASK_URL = environment.BASE_URL + 'task/latest';

  constructor(private http: HttpClient) { }

  /**
   *  GET | foglamp/schedule/type
   */
  public getScheduleType() {
    return this.http.get(this.GET_SCHEDULE_TYPE)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }


  /**
   *  GET | /foglamp/schedule
   */
  public getSchedules() {
    return this.http.get(this.GET_SCHEDULE)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  GET | /foglamp/schedule/{schedule_id}
   */
  public getSchedule(schedule_id) {
    return this.http.get(this.GET_SCHEDULE + '/' + schedule_id)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   * Create schedule
   *
   * POST | /foglamp/schedule
   *
   */
  public createSchedule(payload: any) {
    return this.http.post(this.GET_SCHEDULE, JSON.stringify(payload))
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
    * Update schedule
    *
    * PUT | /foglamp/schedule/{schedule_id}
    *
    */
  public updateSchedule(schedule_id, payload: any) {
    return this.http.put(this.GET_SCHEDULE + '/' + schedule_id, JSON.stringify(payload))
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }


  /**
    * Delete schedule
    *
    * DELETE | /foglamp/{schedule_id}
    *
    */
  public deleteSchedule(schedule_id: any) {
    return this.http.delete(this.GET_SCHEDULE + '/' + schedule_id)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }


  /**
   *  GET | /foglamp/schedule/process
   */
  public getScheduledProcess() {
    return this.http.get(this.GET_SCHEDULE_PROCESS)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  PUT | /foglamp/schedule/{schedule_id}/enable
   */
  public enableSchedule(id) {
    return this.http.put(this.GET_SCHEDULE + '/' + id + '/' + 'enable', null)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  PUT | /foglamp/schedule/{schedule_id}/disable
   */
  public disableSchedule(id) {
    return this.http.put(this.GET_SCHEDULE + '/' + id + '/' + 'disable', null)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  GET | /foglamp/task/latest
   */
  public getLatestTask() {
    return this.http.get(this.LATEST_TASK_URL)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  GET | /foglamp/task
   */
  public getTasks(state: string) {
    let params = new HttpParams();
    params = params.append('state', state);
    return this.http.get(this.TASKS_URL, { params: params })
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  PUT | /foglamp/task/{task_id}/cancel
   */
  public cancelTask(id) {
    return this.http.put(this.TASKS_URL + '/' + id + '/cancel', null)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }
}
