export const environment = {
  production: true,
  BASE_URL: localStorage.getItem('SERVICE_URL') == null ? 'https://127.0.0.1:1995/foglamp/' : localStorage.getItem('SERVICE_URL')
};
