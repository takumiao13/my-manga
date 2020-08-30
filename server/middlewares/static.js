const mount = require('koa-mount');
const static = require('koa-static');
const pathFn = require('path');

const MAX_AGE = 30 * 24 * 60 * 60;

const staticDist = (app) => {
  const { isElectron, appinfo } = app.config();
  const assetsPath = isElectron ? 'electron_dist/assets' : 'dist';

  return static(pathFn.resolve(appinfo.context, assetsPath), {
    index: false,
    maxage: MAX_AGE
  })
}

const staticAssets = (app) => {
  return mount('/assets', staticDist(app))
}

module.exports = [ staticDist, staticAssets ];