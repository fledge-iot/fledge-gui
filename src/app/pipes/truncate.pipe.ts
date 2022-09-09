import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  transform(item: string, from: string): any {
    return item ? item.substring(item.lastIndexOf(from) + 1) : item;
  }
}
