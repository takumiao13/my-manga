const mount = require('koa-mount');
const static = require('koa-static');
const pathFn = require('path');

const staticDist = ({ options }) => {
  const { isElectron, appinfo } = options;
  const assetsPath = isElectron ? 'electron_dist/assets' : 'dist';

  return static(pathFn.resolve(appinfo.context, assetsPath))
}

const staticAssets = ({ options }) => {
  const maxage = 30 * 24 * 60 * 60;

  return mount(
    '/assets', 
    staticDist({ options }), 
    { maxage }
  )
}

module.exports = [ staticDist, staticAssets ];