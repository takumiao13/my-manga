const pathFn = require('path');
const fs = require('./helpers/fs');
const os = require('os');
const env = process.env;

require('dotenv-flow').config({
  node_env: env.APP_MODE || 'prod',
  path: pathFn.join(__dirname, 'envs'),
  silent: true
});

const pkgPath = pathFn.resolve(__dirname, '../package.json');
let pkg = fs.readFileSync(pkgPath, { encode: 'utf8' });
pkg = JSON.parse(pkg);

const appName = env.APP_MODE ? 
  `${pkg.name}-${env.APP_MODE}` :
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
  port: 3033,
  baseDir: process.cwd(),
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

module.exports = config;