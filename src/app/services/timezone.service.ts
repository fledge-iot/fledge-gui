import { Injectable } from '@angular/core';

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
