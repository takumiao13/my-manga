const chalk = require('chalk');
const open = require('open');
const defaultGateway = require('default-gateway');
const address = require('address');
const { log } = require('./logger');
const App = require('../server');

function start(args = {}, callback) {
  const { port, dir: baseDir, settings, isElectron } = args;
  const options = {
    host: isElectron ? 'localhost' : getHost()
  };
  if (port) options.port = port;
  if (baseDir) options.baseDir = baseDir;
  if (settings) options.settings = settings;
  if (isElectron) options.isElectron = isElectron;

  const app = new App(options);
  app.start(() => {
    const { host, port, protocol } = app.options;
    const localURL = `${protocol}://localhost:${chalk.green(port)}`
    const networkURL = `${protocol}://${host}:${chalk.green(port)}`;

    log(`${chalk.yellow('App running at:')}`);
    log(`- Network: ${networkURL}`);
    log(`- Local: ${localURL}`);
    log(`Hit CTRL-C to stop the server`);

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