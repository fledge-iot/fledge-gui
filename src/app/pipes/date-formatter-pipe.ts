import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';
import { TimezoneService } from '../services/timezone.service';

/*
 * Time helper using momentjs
 * Usage:
 *   timestamp | dateparser:'DD.MM.YYYY'
 * Defaults to 'L' - locale ie. '01/24/2017'
*/
@Pipe({ name: 'dateparser' })
export class DateFormatterPipe implements PipeTransform {
  constructor(private timezoneService: TimezoneService) { }
  transform(value: string, arg: string): string {
    if (value != '') {
      const timezone = this.timezoneService.getTimezone();
      const time = timezone === 'local' ? moment.utc(value).local().format(arg) : moment.utc(value).format(arg);
      return time;
    }
  }
}
