const env = process.env;
const { hostname, protocol } = window.location;
const port = env.PORT;

export default {
  host: hostname,
  port,
  //baseURL: 'https://47.103.213.213:3033/',
  baseURL: `${protocol}//${hostname}:${port}/`,
}