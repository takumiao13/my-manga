import { qs, inElectron } from '@/helpers';

const urlParams = qs();
const port = urlParams['port'];

export default {
  port,
  baseURL: inElectron ? `http://localhost:${port}/` : '/'
}