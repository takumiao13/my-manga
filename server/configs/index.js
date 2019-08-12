const pathFn = require('path');
const fs = require('fs-extra');
const { assign } = require('../helpers');

const name = {
  development: 'dev'
}[process.env.NODE_ENV] || 'prod';

const config = require(`./config.${name}`)();
const pkgPath = pathFn.resolve(__dirname, '../../package.json');

// @fixed should handle exception
let pkg = fs.readFileSync(pkgPath, { encode: 'utf8' });
pkg = JSON.parse(pkg);

// @fixed should use something like merge
assign(config, {
  appinfo: {
    pkg,
    name: pkg.name,
    HOME: process.env.HOMEPATH,
    context: pathFn.resolve(__dirname, '../../')
  }
});

module.exports = config;