import { Injectable } from '@angular/core';
import { Microfrontend } from './microfrontend';
import { flatten } from 'lodash';

@Injectable({ providedIn: 'root' })
export class LookupService {
  async lookup(): Promise<Microfrontend[]> {
    const routes = await this.readRoutes();
    let promiseArray = [];
    routes.forEach(el => {
      promiseArray.push(fetch(`./${el}/assets/routes.json`));
    });

    return Promise.all(promiseArray)
      .then(results => Promise.all(results.map(r => r.json())))
      .then((results) => {
        return Promise.resolve(flatten(results));
      })
      .catch(() => {
        return Promise.resolve([]);
      })
  }

  async readRoutes(): Promise<string[]> {
    return fetch('./assets/routes.txt').
      then(res => res.text())
      .then((result) => {
        const routes = result.split('\n').filter((item) => item);
        return Promise.resolve(routes);
      }).catch(err => {
        console.log(err)
        return Promise.resolve([]);
      });
  }
}
