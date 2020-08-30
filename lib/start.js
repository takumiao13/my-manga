const chalk = require('chalk');
const open = require('open');
const os = require('os');
const defaultGateway = require('default-gateway');
const address = require('address');
const { log, error } = require('./logger');
const fs = require('fs-extra');
const pathFn = require('path');
const { createIndex, dropIndex } = require('./indexing');
const App = require('../server');

async function start(args = {}, callback) {
  const { isElectron, index } = args;
  const appMode = process.env.APP_MODE;
  const port = args.port || process.env.PORT;
  const appData = args.appData || process.env.APP_DATA || process.cwd();
  const settingsPath = pathFn.join(appData, 'settings.json');

  if (!fs.pathExistsSync(settingsPath)) {
    error('my manga cannot find settings in --app-data or $APP_DATA please check it');
    return;
  }

  const options = {
    host: isElectron ? 'localhost' : getHost()
  };

  if (port) options.port = port;
  if (isElectron) options.isElectron = isElectron;

  options.settingsPath = settingsPath;

  const baseDir = (!appMode || appMode === 'prod')
    ? appData
    : pathFn.join(appData, `.${appMode}`);
  options.dataDir = pathFn.join(baseDir, 'data');
  options.cacheDir = pathFn.join(baseDir, 'cache');

  const app = new App(options);
  await app.setup();

  // TODO: Support persistence laster
  // create index
  const repos = app.service.repo.list();
  const createIndexPromiseInterator = repos.map(repo => {
    const { baseDir } = app.service.repo.get(repo.dirId);
    return createIndex(app, { dir: baseDir });
  });

  await Promise.all(createIndexPromiseInterator);

  app.start(() => {
    const { host, port, server: { protocol } } = app.config();
    const localURL = `${protocol}://localhost:${chalk.green(port)}`
    const networkURL = `${protocol}://${host}:${chalk.green(port)}`;
    log('');
    log(`APP_MODE: ${appMode || 'prod'}`)
    log(`${chalk.yellow('App running at:')}`);
    log(`- Network: ${networkURL}`);
    log(`- Local: ${localURL}`);
    log('Hit CTRL-C to stop the server');

    if (args.open) open(networkURL); // Open browser
    callback && callback(null, app)
  });

  return app;
};

function getHost() {
  const result = defaultGateway.v4.sync();
  const host = address.ip(result && result.interface);
  return host;
}

module.exports = start;