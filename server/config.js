const pathFn = require('path');
const fs = require('./helpers/fs');
const env = process.env;

require('dotenv-flow').config({
  node_env: env.NODE_ENV || 'prod',
  path: pathFn.join(__dirname, 'envs'),
  silent: true
});

const pkgPath = pathFn.resolve(__dirname, '../package.json');
let pkg = fs.readFileSync(pkgPath, { encode: 'utf8' });
pkg = JSON.parse(pkg);

const config = {
  appinfo: {
    pkg,
    name: pkg.name,
    HOME: env.HOMEPATH,
    context: pathFn.resolve(__dirname, '..')
  }
};

if (env.PORT) config.port = env.PORT;
if (env.DIR) config.baseDir = env.DIR;
if (env.SETTINGS) config.settings = env.SETTINGS;

module.exports = config;