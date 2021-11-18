import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimezoneService {
  private timezone: string = 'local'; // set default to local
  constructor() { }

  setTimezone(val: string) {
    this.timezone = val;
  }

  getTimezone() {
    return this.timezone;
  }

}
