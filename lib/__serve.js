const chalk = require('chalk');
const App = require('../server');
const { log } = require('./logger');

function serve(options = {}, callback) {
  const host = 'localhost';
  const { port, dir: baseDir, settings, isElectron } = options;
  const opts = { host };
  if (port) opts.port = port;
  if (baseDir) opts.baseDir = baseDir;
  if (settings) opts.settings = settings;
  if (isElectron) opts.isElectron = isElectron;

  const app = new App(opts);

  app.start(() => {
    const { port } = app.options;
    const url = `http://${host}:${port}`;
    log(`start dev server: ${chalk.yellow(url)}`);

    callback && callback(null, app);
  });
  
  return app;
};

module.exports = serve;