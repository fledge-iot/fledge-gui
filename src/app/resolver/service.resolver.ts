import { Injectable } from '@angular/core';
import { ServicesAPIService } from '../services';
import { Resolve } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ServiceResolver implements Resolve<any> {
  constructor(private service: ServicesAPIService) { }

  resolve() {
    return this.service.getAllServices();
  }

}
