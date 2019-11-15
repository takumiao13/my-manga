import qs from '@/helpers/querystring';
import platform from '@/helpers/platform';

const urlParams = qs.parse();
const port = platform.isElectron() ? urlParams['port'] : window.location.port;
const baseURL = platform.isElectron() ? `http://localhost:${port}/` : '/';

export default {
  host: window.location.hostname,
  port,
  baseURL
}