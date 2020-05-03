const mount = require('koa-mount');
const static = require('koa-static');
const pathFn = require('path');

const staticDist = (app) => {
  const { isElectron, appinfo } = app.config();
  const assetsPath = isElectron ? 'electron_dist/assets' : 'dist';

  return static(pathFn.resolve(appinfo.context, assetsPath), { 
    maxage: 30 * 24 * 60 * 60
  })
}

const staticAssets = (app) => {

  return mount(
    '/assets', 
    staticDist(app)
  )
}

module.exports = [ staticDist, staticAssets ];