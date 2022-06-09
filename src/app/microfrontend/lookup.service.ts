import { Injectable } from '@angular/core';
import { Microfrontend } from './microfrontend';

@Injectable({ providedIn: 'root' })
export class LookupService {
  lookup(): Promise<Microfrontend[]> {
    return fetch('./assets/json/mfe-routes.json').then(res => res.json())
      .then(jsonData => {
        return Promise.resolve(jsonData);
      }).catch(err => {
        console.error('json load error', err);
      });;
  }
}
