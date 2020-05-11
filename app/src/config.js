import qs from '@/helpers/querystring';

const urlParams = qs.parse();
const { hostname, protocol } = window.location;
const port = process.env.APP_PLATFORM === 'web' ? 
  window.location.port : urlParams['port'];

const api = {
  HOST: process.env.API_HOST || hostname,
  PORT: process.env.API_PORT || port
};

if (process.env.APP_PLATFORM === 'web') {
  if (process.env.NODE_ENV === 'production') {
    api.BASE_URL = '/';
  } else {
    let url = api.HOST;
    if (api.PORT) url += `:${api.PORT}`;
    url += '/'
    api.BASE_URL = url;
  }
} else {
  api.BASE_URL = `${protocol}//localhost:${api.PORT}/`
}

const config = {
  api
};

console.log(config);

export default config;