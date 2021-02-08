import { Injectable } from '@angular/core';
import { ServicesApiService } from '../services';
import { Resolve } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServiceResolver implements Resolve<any> {
  constructor(private service: ServicesApiService) { }

  resolve() {
    return this.service.getAllServices().pipe(
      catchError(error => {
        console.error(error);
        return of(null);
      }));
  }
}
