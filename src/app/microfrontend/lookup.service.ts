import { Injectable } from '@angular/core';
import { Microfrontend } from './microfrontend';

@Injectable({ providedIn: 'root' })
export class LookupService {
  lookup(): Promise<Microfrontend[]> {
    return fetch('./assets/routes/default-routes.json').then(res => res.json())
      .then(jsonData => {
        return Promise.resolve(jsonData);
      }).catch(() => {
        // console.error('json load error', err);
        return Promise.resolve([]);
      });;
  }
}
