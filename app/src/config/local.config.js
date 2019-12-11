const env = process.env;
const { hostname, protocol } = window.location;
const port = env.PORT;

export default {
  host: hostname,
  port,
  baseURL: `${protocol}//${hostname}:${port}/`,
}