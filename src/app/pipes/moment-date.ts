import { Pipe, PipeTransform } from '@angular/core';

import * as moment from 'moment';

/*
 * Time helper using momentjs
 * Usage:
 *   timestamp | dateparser:'DD.MM.YYYY'
 * Defaults to 'L' - locale ie. '01/24/2017'
*/
@Pipe({name: 'dateparser'})
export class MomentDatePipe implements PipeTransform {
  transform(value: string, arg: string): string {
      if (value !== '') {
        return moment(value).format(arg);
      } else {
        return value;
      }
  }
}
