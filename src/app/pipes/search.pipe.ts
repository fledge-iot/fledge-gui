import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'SearchPipe'
})
export class SearchPipe implements PipeTransform {
  transform(items: any, searchText: any): any {
    if (searchText) {
      if (searchText instanceof Array && searchText.length !== 0) {       
        let filteredData = [];
        for (let text of searchText) {
          text = text.toLowerCase();
          filteredData = filteredData.concat(items.filter((item: any) => {          
            if (items && items[0].details) {
              return item.details.name.toLowerCase().indexOf(text) > -1;
            } else {
              return item.toLowerCase().indexOf(text) > -1;
            }
          }));
        }
        return filteredData;
      } else {
        searchText = searchText.toLowerCase();
        return items.filter((item: any) => {
          if (items && items[0].details) {
            return item.details.name.toLowerCase().indexOf(searchText) > -1;
          } else {
            return item.toLowerCase().indexOf(searchText) > -1;
          }
        });
      }
    }
    return items;
  }
}
