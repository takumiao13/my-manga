const mount = require('koa-mount');
const static = require('koa-static');
const pathFn = require('path');

const staticDist = ({ options }) => {
  const { isElectron, appinfo } = options;
  const assetsPath = isElectron ? 'electron_dist/assets' : 'dist';

  return static(pathFn.resolve(appinfo.context, assetsPath), { 
    maxage: 30 * 24 * 60 * 60
  })
}

const staticAssets = ({ options }) => {

  return mount(
    '/assets', 
    staticDist({ options })
  )
}

module.exports = [ staticDist, staticAssets ];