const { DefinePlugin } = require('webpack');
const pathFn = require('path');
const env = process.env;

// Constants
const ENV_KEYS = [
  'NODE_ENV', 'BASE_URL', 'IS_ELECTRON',
  'API_PORT', 'API_BASE_URL', 'APP_MODE'
];

const PRIMARY_COLOR = '#dc143c';

// Define dirs
const assetsDir = env.IS_ELECTRON ? 'assets' : '';

const outputDir = env.NODE_ENV === 'production' ? 
  env.IS_ELECTRON ? '../electron_dist/' : '../dist' :
  'dist';

const publicPath = env.NODE_ENV === 'production' ? 
  env.IS_ELECTRON ? './' : '/assets' : 
  '/';


// Define icon dir & appName by `APP_MODE`
let publicModeDir = 'prod';

if (env.APP_MODE) {
  publicModeDir = env.APP_MODE.toLowerCase();
}

let appName = 'My Manga';

if (env.APP_MODE) {
  appName += ` [${env.APP_MODE}]`;
}

module.exports = {
  assetsDir,
  outputDir, 
  publicPath,
  productionSourceMap: !!(env.NODE_ENV === 'production' && env.APP_MODE),
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
    const processEnv = ENV_KEYS.reduce((agg, key) => {
      agg[key] = env[key];
      return agg;
    }, {});
    const pkg = require('../package.json');
    processEnv.APP_NAME = appName; 
    processEnv.APP_VERSION = pkg.version;
    processEnv.APP_PUBLIC_MODE_DIR = pathFn.posix.join(publicPath, publicModeDir);
    

    processEnv.APP_LOGO = `${publicModeDir}/icons/apple-touch-icon.png`;
    processEnv.APP_PRIMARY_COLOR = PRIMARY_COLOR;

    const stringifiedENV = {};
    Object.keys(processEnv).map(function(key) {
      stringifiedENV[key] = JSON.stringify(processEnv[key]);
    });

    // Evn vars
    config.plugin('define').use(DefinePlugin, [
      { 'process.env': stringifiedENV } 
    ]);

    // htmlWebpackPlugins options
    config.plugin('html').tap(args => {
      args[0].ENV = processEnv;
      return args
    });

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
  },
  pwa: {
    name: appName,
    themeColor: '#fff',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    manifestPath: `manifest.json?mode=${env.APP_MODE || 'prod'}`,
    manifestOptions: {
      description: "A Free Comics Management.",
      start_url: "/index.html",
      display: "standalone",
      background_color: "#ffffff",
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
    }
  }
}