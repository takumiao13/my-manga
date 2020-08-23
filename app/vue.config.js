const pathFn = require('path');
const env = process.env;
require('dotenv-flow').config({
  node_env: env.APP_MODE,
  path: pathFn.join('envs', env.APP_PLATFORM),
  silent: true
});
const pkg = require('../package.json');

console.log('NODE_ENV:', env.NODE_ENV);
console.log('APP_VERSION:', pkg.version);
console.log('APP_MODE:', env.APP_MODE);
console.log('APP_PLATFORM:', env.APP_PLATFORM);

const { DefinePlugin } = require('webpack');
const CustomHtmlWebpackPlugin = require('./vue-config/plugins/CustomHtmlWebpackPlugin');
const CompressionPlugin = require('compression-webpack-plugin');

// Constants
const ENV_KEYS = [
  'NODE_ENV', 'BASE_URL', 'IS_ELECTRON',
  'API_PORT', 'API_HOST', 'APP_MODE', 'APP_PLATFORM'
];

const PRIMARY_COLOR = '#dc143c';

const Colors = {
  prod: PRIMARY_COLOR,
  dev: '#999',
  rc: '#333'
};

// Define dirs
const assetsDir = 'assets'

const outputDir = env.NODE_ENV === 'production' ? 
  env.IS_ELECTRON ? '../electron_dist/' : '../dist' :
  'dist';

// const publicPath = env.NODE_ENV === 'production' ? 
//   env.IS_ELECTRON ? './' : '/' : 
//   '/';

const publicPath = './';

// Define icon dir & appName by `APP_MODE`
const publicModeDir = `mode/${env.APP_MODE.toLowerCase()}`;

let appName = 'MyManga';

if (env.APP_MODE !== 'prod') {
  appName += ` [${env.APP_MODE.toUpperCase()}]`;
}

const themeColor = Colors[env.APP_MODE];

module.exports = {
  assetsDir,
  outputDir, 
  publicPath,
  productionSourceMap: !!(env.NODE_ENV === 'production' && env.APP_MODE !== 'prod'),
  css: {
    loaderOptions: {
      sass: {
        data: `
          $primary: ${PRIMARY_COLOR};
          $secondary: #999;
        `
      }
    }
  },
  chainWebpack: config => {
    // Define process env
    const processEnv = ENV_KEYS.reduce((agg, key) => {
      agg[key] = env[key];
      return agg;
    }, {});
    processEnv.APP_NAME = appName; 
    processEnv.APP_VERSION = pkg.version;
    processEnv.APP_LOGO = `${publicModeDir}/icons/apple-touch-icon.png`;
    processEnv.APP_PRIMARY_COLOR = PRIMARY_COLOR;

    const stringifiedENV = {};
    Object.keys(processEnv).map(function(key) {
      stringifiedENV[key] = JSON.stringify(processEnv[key]);
    });

    // Plugins
    config.plugin('define').use(DefinePlugin, [
      { 'process.env': stringifiedENV } 
    ]);

    config.plugin('custom-html').use(CustomHtmlWebpackPlugin, [
      {
        appName: appName,
        publicModeDir
      }
    ]);

    // htmlWebpackPlugins options
    config.plugin('html').tap(args => {
      args[0].ENV = processEnv;
      return args
    });

    // enable gzip compress
    if (env.NODE_ENV === 'production') {
      config.plugin('gzip').use(CompressionPlugin, [{
        filename: '[path].gz[query]',
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 10240,
        minRatio: 0.8,
        deleteOriginalAssets: true
      }])
    }
 
    // Configure rules
    const sharedPath = pathFn.resolve(__dirname, '../shared');
    config.resolve.alias
      .set('shared', sharedPath);

    const eslintRule = config.module.rule('eslint');
    eslintRule.exclude.add(sharedPath);

    // svg rule loader
    const svgRule = config.module.rule('svg');
    svgRule.uses.clear()
    svgRule.exclude.add(/node_modules/)
    svgRule
      .test(/icons\/.+?\.svg$/)
      .use('svg-sprite-loader')
        .loader('svg-sprite-loader')
        .options()
    
    // inline svg loader
    const svgInlineRule = config.module.rule('svg-inline');
    svgInlineRule.exclude.add(/icons/)
    svgInlineRule
      .test(/\.svg$/)
      .oneOf('inline')
        .resourceQuery(/inline/)
        .use('svg-url-loader')
          .loader('svg-url-loader')
          .end()
        .end()
      .oneOf('external')
        .use('file-loader')
          .loader('file-loader')
          .options({
            name: 'assets/[name].[hash:8].[ext]',
          })
          .end()
        .end();
  },
  pwa: {
    name: appName,
    themeColor: '#fff', // this will change safari pinned color.
    msTileColor: themeColor,
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: '#fff',
    manifestPath: `manifest.json?mode=${env.APP_MODE || 'prod'}&ver=${pkg.version}`,
    manifestOptions: {
      description: "A Free Comics Management",
      start_url: '.', // since publicDir is `assets` so define parent as root url
      display: 'standalone',
      background_color: '#ffffff',
      icons: [
        {
          'src': `./${publicModeDir}/icons/android-chrome-192x192.png`,
          'sizes': '192x192',
          'type': 'image/png'
        },
        {
          'src': `./${publicModeDir}/icons/android-chrome-512x512.png`,
          'sizes': '512x512',
          'type': 'image/png'
        }
      ],
    },
    iconPaths: {
      favicon32: `${publicModeDir}/icons/favicon-32x32.png`,
      favicon16: `${publicModeDir}/icons/favicon-16x16.png`,
      appleTouchIcon: `${publicModeDir}/icons/apple-touch-icon.png`,
      maskIcon: `${publicModeDir}/icons/safari-pinned-tab.svg`,
      msTileImage: `${publicModeDir}/icons/mstile-144x144.png`
    },
    // configure the workbox plugin (GenerateSW or InjectManifest)
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      // swSrc is required in InjectManifest mode.
      swSrc: 'src/service-worker.js',
      importWorkboxFrom: 'disabled',
      importScripts: 'https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js',
      exclude: [ /index\.html/, /\.map$/ ]
    }
  }
}