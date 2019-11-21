const mount = require('koa-mount');
const static = require('koa-static');
const pathFn = require('path');

const staticDist = ({ config, options }) => {
  const { isElectron } = options;
  const { context } = config.appinfo;
  const assetsPath = isElectron ? 'electron_dist/assets' : 'dist';

  return static(pathFn.resolve(context, assetsPath))
}

const staticAssets = ({ config, options }) => {
  const maxage = 30 * 24 * 60 * 60;

  return mount(
    '/assets', 
    staticDist({ config, options }), 
    { maxage }
  )
}

module.exports = [ staticDist, staticAssets ];