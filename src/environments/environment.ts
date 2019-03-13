// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  BASE_URL: localStorage.getItem('SERVICE_URL') == null ?
   'http://' + location.hostname + ':8081/foglamp/' : localStorage.getItem('SERVICE_URL'),
   VERSION: require('../../package.json').version
};
