export const environment = {
  production: true,
  BASE_URL: localStorage.getItem('SERVICE_URL') == null ? 'http://0.0.0.0:8081/foglamp/' : localStorage.getItem('SERVICE_URL'),
  MANAGEMENT_URL: localStorage.getItem('MANAGEMENT_URL') == null ? '' : localStorage.getItem('MANAGEMENT_URL')
};
