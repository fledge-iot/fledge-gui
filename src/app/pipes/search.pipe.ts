import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'SearchPipe'
})
export class SearchPipe implements PipeTransform {
  transform(items: any, searchText: any): any {
    if (searchText) {
      searchText = searchText.toLowerCase();
      return items.filter((item: any) => {
        return item.details.name.toLowerCase().indexOf(searchText) > -1;
      });
    }
    return items;
  }
}
