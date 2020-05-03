const pathFn = require('path');
const fs = require('./helpers/fs');
const os = require('os');
const env = process.env;

require('dotenv-flow').config({
  node_env: env.NODE_ENV || 'prod',
  path: pathFn.join(__dirname, 'envs'),
  silent: true
});

const pkgPath = pathFn.resolve(__dirname, '../package.json');
let pkg = fs.readFileSync(pkgPath, { encode: 'utf8' });
pkg = JSON.parse(pkg);

const appName = env.NODE_ENV ? 
  `${pkg.name}-${env.NODE_ENV}` :
  pkg.name;

const HOME = env.HOME || env.USERPROFILE || env.HOMEPATH;
const TEMP = os.tmpdir();

const config = {
  appinfo: {
    pkg,
    version: pkg.version,
    startAt: +new Date,
    name: appName,
    HOME,
    TEMP,
    context: pathFn.resolve(__dirname, '..')
  },
  port: 3000,
  baseDir: process.cwd(),
  dataDir: pathFn.join(HOME, appName),
  cacheDir: pathFn.join(TEMP, appName),
  server: {
    protocol: 'http',
    ssl: false, // http default
    clientCert: false, // client auth,
    cors: true,
  },
  image: {
    compression: false,
    imageMagick: false
  }
};

// use dot env to replace config
if (env.PORT) config.port = env.PORT;
if (env.DIR) config.baseDir = env.DIR;
if (env.DATA_DIR) config.dataDir = env.DATA_DIR;
if (env.CACHE_DIR) config.cacheDir = env.CACHE_DIR;
if (env.SETTINGS) config.settings = env.SETTINGS;

module.exports = config;