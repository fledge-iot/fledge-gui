import { Injectable } from '@angular/core';
import { Microfrontend } from './microfrontend';
import { flatten } from 'lodash';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LookupService {
  async lookup(): Promise<Microfrontend[]> {
    if (!environment.production) {
      return fetch('./assets/routes.json').then(res => res.json())
        .then(jsonData => {
          return Promise.resolve(jsonData);
        }).catch(() => {
          // console.error('json load error', err);
          return Promise.resolve([]);
        });
    } else {
      const routes = await this.readRoutes();
      let routesFilePathArray = [];
      routes.forEach(el => {
        routesFilePathArray.push(fetch(`./${el}/assets/routes.json`));
      });

      /**
       * Takes an iterable of promises i.e.routesFilePathArray as an input,
       * and returns a single Promise that resolves to an array of the results
       * of the input promises. This returned promise will
       * resolve when all of the input's promises have resolved,
       * or if the input iterable contains no promises.
       * It rejects immediately upon any of the input promises rejecting or non-promises throwing an error,
       * and will reject with this first rejection message / error.
       */
      return Promise.all(routesFilePathArray)
        /**
         * The Promise.allSettled() method returns a promise that resolves after
         * all of the given promises have either fulfilled or rejected,
         * with an array of objects that each describes the outcome of each promise.
         */
        .then(results => Promise.allSettled(results.map(r => r.json())))
        .then((results) => {
          const response = results.filter(x => x.status === "fulfilled").map((x: any) => x.value);
          return Promise.resolve(flatten(response));
        })
        .catch(() => {
          return Promise.resolve([]);
        });
    }
  }

  async readRoutes(): Promise<string[]> {
    return fetch('./assets/routes.txt').
      then(response => {
        if (!response.ok) {
          throw new Error(response.status + " Failed Fetch ");
        } else {
          return response.text();
        }
      })
      .then((result) => {
        const routes = result.split('\n').filter((item) => item);
        return Promise.resolve(routes);
      }).catch(() => {
        return Promise.resolve([]);
      });
  }
}
