const chalk = require('chalk');
const open = require('open');
const defaultGateway = require('default-gateway');
const address = require('address');
const { log, error } = require('./logger');
const App = require('../server');

function start(options = {}, callback) {
  const { port, dir: baseDir, settings, isElectron } = options;
  const opts = {};
  opts.host = isElectron ? 'localhost' : getHost();
  if (port) opts.port = port;
  if (baseDir) opts.baseDir = baseDir;
  if (settings) opts.settings = settings;
  if (isElectron) opts.isElectron = isElectron;

  const app = new App(opts);

  app.start(() => {
    const { port } = app.options;
    const url = `http://${opts.host}:${port}`;

    log(`App running at:`);
    log(` - Network: ${chalk.yellow(url)}`)
    if (options.open) open(url); // Open browser

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