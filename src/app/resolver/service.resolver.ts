import { Injectable } from '@angular/core';
import { ServicesApiService } from '../services';
import { Resolve } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ServiceResolver implements Resolve<any> {
  constructor(private service: ServicesApiService) { }

  resolve() {
    return this.service.getAllServices();
  }

}
