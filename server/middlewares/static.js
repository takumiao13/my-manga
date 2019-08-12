const mount = require('koa-mount');
const static = require('koa-static');
const pathFn = require('path');

module.exports = ({ config, options }) => {
  const { isElectron } = options;
  const { context } = config.appinfo;
  const maxage = 30 * 24 * 60 * 60;

  return mount('/assets', 
    static(pathFn.resolve(context, isElectron ? 'electron_dist/assets' : 'dist'), {
      maxage
    })
  );
}