export const environment = {
  production: true,
  BASE_URL: localStorage.getItem('SERVICE_URL') == null ? 'http://127.0.0.1:8081/foglamp/' : localStorage.getItem('SERVICE_URL')
};
