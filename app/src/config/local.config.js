const { hostname } = window.location;

export default {
  host: hostname,
  port: process.env.API_PORT,
  apiBaseURL: process.env.API_BASE_URL
}