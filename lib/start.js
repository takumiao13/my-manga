const chalk = require('chalk');
const open = require('open');
const os = require('os');
const defaultGateway = require('default-gateway');
const address = require('address');
const { log } = require('./logger');
const { createIndex, dropIndex } = require('./indexing');
const App = require('../server');

async function start(args = {}, callback) {
  const { 
    port, settings, isElectron, index, 
    dir: baseDir,  
    datadir,
    cachedir
  } = args;

  const options = {
    host: isElectron ? 'localhost' : getHost()
  };
  if (port) options.port = port;
  if (baseDir) options.baseDir = baseDir;
  if (settings) options.settings = settings;
  if (isElectron) options.isElectron = isElectron;
  if (datadir) options.dataDir = datadir;
  if (cachedir) options.cacheDir = cachedir;

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
    const { host, port, protocol } = app.options;
    const localURL = `${protocol}://localhost:${chalk.green(port)}`
    const networkURL = `${protocol}://${host}:${chalk.green(port)}`;
    log('');
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