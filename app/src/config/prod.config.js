import qs from '@/helpers/querystring';
import platform from '@/helpers/platform';

const urlParams = qs.parse();
const { hostname, protocol } = window.location;
const port = platform.isElectron() ? urlParams['port'] : window.location.port;
const baseURL = platform.isElectron() ? `${protocol}//localhost:${port}/` : '/';

export default {
  host: hostname,
  port,
  baseURL
}