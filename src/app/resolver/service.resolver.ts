import { Injectable } from '@angular/core';
import { ServicesHealthService } from '../services';
import { Resolve } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ServiceResolver implements Resolve<any> {
  constructor(private service: ServicesHealthService) { }

  resolve() {
    return this.service.getAllServices();
  }

}
