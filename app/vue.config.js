const { DefinePlugin } = require('webpack');
const pathFn = require('path');
const env = process.env;

module.exports = {
  assetsDir: env.IS_ELECTRON ? 'assets' : '',
  outputDir: env.NODE_ENV === 'production' ? 
    env.IS_ELECTRON ? '../electron_dist/' : '../dist' :
    'dist/', 
  publicPath: env.NODE_ENV === 'production' ? 
    env.IS_ELECTRON ? './' : './assets' : 
    '/',
  chainWebpack: config => {
    const sharedPath = pathFn.resolve(__dirname, '../shared');

    config.plugin('define').use(DefinePlugin, [
      {
        'process.env': { 
          PORT: 8000, // dev server port
          NODE_NEV: JSON.stringify(env.NODE_ENV),
          IS_ELECTRON: JSON.stringify(env.IS_ELECTRON)
        }
      }
    ])

    config.resolve.alias
      .set('shared', sharedPath);

    const eslintRule = config.module.rule('eslint');
    eslintRule.exclude.add(sharedPath);

    // svg rule loader
    const svgRule = config.module.rule('svg');
    svgRule.uses.clear()
    svgRule.exclude.add(/node_modules/)
    svgRule
      .test(/\.svg$/)
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options();

    const curRule = config.module.rule('cur');
    curRule
      .test(/\.cur$/)
      .use('file-loader')
      .loader('file-loader')
      .options();

    const jsRule = config.module.rule('js');
  }
}