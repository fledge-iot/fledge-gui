import { Pipe, PipeTransform, Injectable } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
    name: 'filter'
})
@Injectable()
export class FilterPipe implements PipeTransform {
    transform(items: any[], field: string, value: string): any[] {
        if (!field || !value) {
            return items;
        }
        return items.filter(singleItem =>
        singleItem.source.toLowerCase().indexOf(value.toLowerCase()) !== -1 ||
        singleItem.severity.toLowerCase().indexOf(value.toLowerCase()) !== -1) ;
    }
}
