import { loadRemoteModule, initFederation } from '@angular-architects/native-federation';
import { Routes } from '@angular/router';
import { appRoutes } from './app/app.routing';
import { Microfrontend } from './app/microfrontend/microfrontend';

let federationInitPromise: Promise<unknown> | null = null;
function ensureFederationInitialized(): Promise<unknown> {
  if (!federationInitPromise) {
    federationInitPromise = initFederation('assets/federation.manifest.json');
  }
  return federationInitPromise;
}

export function buildRoutes(options: Microfrontend[]): Routes {
  console.log('options', options);
  const lazyRoutes: Routes = options.map(o => ({
    path: 'mlmodels',
    //loadChildren: () => loadRemoteModule('mlmodels', o.exposedModule).then(m => m[o.ngModuleName])
    loadChildren: () =>
      ensureFederationInitialized()
        .then(() => loadRemoteModule({ remoteName: 'mlmodels', exposedModule: './MlModelModule' }))
        .then(m => m.MlModelModule)
  }));

  /**
   * add redirection routh path after mfe because router order
   * is static path first followed by an empty path route
   * Read more https://angular.io/guide/router#route-order
  */
  lazyRoutes.push({ path: '**', redirectTo: '' });
  // remove list item of appRoutes that is { path: '**', redirectTo: '' }
  return [...appRoutes.slice(0, -1), ...lazyRoutes];
}
