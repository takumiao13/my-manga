import { qs, inElectron } from '@/helpers';

const urlParams = qs();
const port = inElectron ? urlParams['port'] : window.location.port;

export default {
  host: window.location.hostname,
  port,
  baseURL: inElectron ? `http://localhost:${port}/` : '/'
}