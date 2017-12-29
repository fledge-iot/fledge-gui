import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';
// import  Utils, {BASE_URL} from './utils'
import { environment } from '../../environments/environment';

@Injectable()
export class SchedulesService {

  private GET_SCHEDULE_TYPE = environment.BASE_URL + 'schedule/type';
  private GET_SCHEDULE_PROCESS = environment.BASE_URL + 'schedule/process';
  private GET_SCHEDULE = environment.BASE_URL + 'schedule';

  private GET_TASKS = environment.BASE_URL + 'task';
  private GET_LATEST_TASK = environment.BASE_URL + 'task/latest';
  private CANCEL_TASK = environment.BASE_URL + 'task/cancel';

  constructor(private http: Http) { }

  /**
   *  GET | foglamp/schedule/type
   */
  public getScheduleType() {
    return this.http.get(this.GET_SCHEDULE_TYPE)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }


  /**
   *  GET | /foglamp/schedule
   */
  public getSchedules() {
    return this.http.get(this.GET_SCHEDULE)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }

  /**
   *  GET | /foglamp/schedule/{schedule_id}
   */
  public getSchedule(schedule_id) {
    return this.http.get(this.GET_SCHEDULE + '/' + schedule_id)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }

  /**
   * Create schedule
   *
   * POST | /foglamp/schedule
   *
   */
  public createSchedule (payload: any) {
      console.log('Payload', payload);
      return this.http.post(this.GET_SCHEDULE, JSON.stringify(payload))
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }

 /**
   * Update schedule
   *
   * PUT | /foglamp/schedule/{schedule_id}
   *
   */
  public updateSchedule (schedule_id, payload: any) {
      console.log('schedule_id', schedule_id);
      console.log('payload', payload);
      return this.http.put(this.GET_SCHEDULE + '/' + schedule_id, JSON.stringify(payload))
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }



 /**
   * Delete schedule
   *
   * DELETE | /foglamp/{schedule_id}
   *
   */
  public deleteSchedule (schedule_id: any) {
     return this.http.delete(this.GET_SCHEDULE + '/' + schedule_id)
            .map(response => response.json())
            .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }


  /**
   *  GET | /foglamp/schedule/process
   */
  public getScheduledProcess() {
    return this.http.get(this.GET_SCHEDULE_PROCESS)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }

  /**
   *  GET | /foglamp/task/latest
   */
  public getLatestTask() {
    return this.http.get(this.GET_LATEST_TASK)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }

  /**
   *  GET | /foglamp/task
   */
  public getTasks(state: string) {
     let params: URLSearchParams = new URLSearchParams();
    return this.http.get(this.GET_TASKS, { params: {state: state} })
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }

  /**
   *  PUT | /foglamp/task/cancel/{task_id}
   */
  public cancelTask(id) {
    return this.http.put(this.CANCEL_TASK + '/' + id, null)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }
}
