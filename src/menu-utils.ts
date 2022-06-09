import { loadRemoteModule } from '@angular-architects/module-federation';
import { Routes } from '@angular/router';
import { appRoutes } from './app/app.routing';
import { Microfrontend } from './app/microfrontend/microfrontend';


export function buildRoutes(options: Microfrontend[]): Routes {

  const lazyRoutes: Routes = options.map(o => ({
    path: o.routePath,
    loadChildren: () => loadRemoteModule(o).then(m => m[o.ngModuleName])
  }));

  return [...appRoutes, ...lazyRoutes];
}
