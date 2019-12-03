export const environment = {
  production: true,
  BASE_URL: localStorage.getItem('SERVICE_URL') ==
  null ? 'http://' + location.hostname + ':8081/fledge/' : localStorage.getItem('SERVICE_URL'),
  VERSION: require('../../package.json').version
};
