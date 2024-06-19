import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'SearchPipe'
})
export class SearchPipe implements PipeTransform {
  transform(items: any, searchText: any): any {
    if (searchText) {
      console.log('search', searchText);
      if (searchText instanceof Array) {
        let filteredData = [];
        for (const text of searchText) {
          console.log('TEXT', text);
          const data = this.filterData(items, text);
          filteredData.push(data);
        }
        items = filteredData;
      } else {
        this.filterData(items, searchText);
      }
      // this.filterData(items, searchText);
      // searchText = searchText.toLowerCase();
      // return items.filter((item: any) => {
      //   if (items && items[0].details) {
      //     return item.details.name.toLowerCase().indexOf(searchText) > -1;
      //   } else {
      //     return item.toLowerCase().indexOf(searchText) > -1;
      //   }
      // });
    }
    return items;
  }

  filterData(items: any, searchText: any) {
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
