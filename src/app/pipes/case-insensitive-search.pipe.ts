import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'caseInsensitiveSearch',
    standalone: false
})
export class CaseInsensitiveSearchPipe implements PipeTransform {
  transform(items: any[], searchText: string, field: string): any[] {
    if (!items) return [];
    if (!searchText) return items;
    
    searchText = searchText.toLowerCase();
    
    return items.filter(item => {
      if (item[field]) {
        return item[field].toLowerCase().includes(searchText);
      }
      return false;
    });
  }
} 