// import('./bootstrap')
// 	.catch(err => console.error(err));

import { loadRemoteEntry } from '@angular-architects/module-federation';

fetch('./assets/json/mfe-routes.json').then(res => res.json())
  .then(jsonData => {
    const promises: any[] = [];
    jsonData.forEach((mfe: any) => {
      promises.push(loadRemoteEntry({ type: mfe.type, remoteEntry: mfe.remoteEntry }))
    })
    Promise.all(promises)
      .catch(err => console.error('Error loading remote entries', err))
      .then(() => {
        import('./bootstrap')
      })
      .catch(err => console.error('got error', err));
  }).catch(err => {
    console.error('json load error', err)
    import('./bootstrap');
  });

