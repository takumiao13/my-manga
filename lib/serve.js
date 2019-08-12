const chalk = require('chalk');
const App = require('../server');
const { log } = require('./logger');

function serve(options = {}, callback) {
  const host = 'localhost';
  const opts = { 
    host,
    port: options.port,
    baseDir: options.dir,
    settings: options.settings,
    isElectron: options.isElectron
  };

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