import { Injectable } from '@angular/core';
import { ServicesApiService } from '../services';

import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServiceResolver  {
  constructor(private service: ServicesApiService) { }

  resolve() {
    return this.service.getAllServices().pipe(
      catchError(error => {
        console.error(error);
        // In case of error, return null
        return of(null);
      }));
  }
}
