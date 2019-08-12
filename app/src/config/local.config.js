const env = process.env;
const hostname = window.location.hostname;
const port = env.PORT;

export default {
  host: hostname,
  port,
  baseURL: `http://${hostname}:${port}/`,
}