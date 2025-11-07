import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DelimiterStoreService {
  private storedValue: any;

  setDelimiter(val: any) {
    this.storedValue = val;
  }

  getDelimiter(): any {
    return this.storedValue;
  }
}
