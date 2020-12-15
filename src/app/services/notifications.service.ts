import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable()
export class NotificationsService {
  notifyServiceEmitter = new BehaviorSubject<any>(null);

  private GET_NOTIFICATION_URL = environment.BASE_URL + 'notification';

  constructor(private http: HttpClient) { }

  getNotificationInstance() {
    return this.http.get(this.GET_NOTIFICATION_URL).pipe(
      map(response => response),
      catchError((error) => throwError(error)));
  }

  getNotificationPlugins() {
    return this.http.get(this.GET_NOTIFICATION_URL + '/plugin').pipe(
      map(response => response),
      catchError((error) => throwError(error)));
  }

  getNotificationTypeList() {
    return this.http.get(this.GET_NOTIFICATION_URL + '/type').pipe(
      map(response => response),
      catchError((error) => throwError(error)));
  }

  addNotificationInstance(payload: any) {
    return this.http.post(this.GET_NOTIFICATION_URL, payload).pipe(
      map(response => response),
      catchError((error) => throwError(error)));
  }

  deleteNotification(notificationName: string) {
    return this.http.delete(this.GET_NOTIFICATION_URL + '/' + encodeURIComponent(notificationName)).pipe(
      map(response => response),
      catchError((error) => throwError(error)));
  }

  deleteNotificationService(notificationName: string) {
    return this.http.delete(environment.BASE_URL + 'service/' + encodeURIComponent(notificationName)).pipe(
      map(response => response),
      catchError((error) => throwError(error)));
  }
}
