let config;

if (process.env.NODE_ENV === 'development') {
  config = require('./local.config').default;
} else if (process.env.NODE_ENV === 'production') {
  config = require('./prod.config').default;
}

console.log('CONF', config);

export default config;