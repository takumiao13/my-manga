const chalk = require('chalk');
const open = require('open');
const defaultGateway = require('default-gateway');
const address = require('address');
const { log } = require('./logger');
const { createIndex, dropIndex } = require('./indexing');
const MangaWatcher = require('../server/child_process/manga-watcher')
const App = require('../server');

async function start(args = {}, callback) {
  const { 
    port, settings, isElectron, index, watch,
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
  if (datadir) options.datadir = datadir;
  if (cachedir) options.cachedir = cachedir;

  const app = new App(options);
  await app.setup();

  // TODO: Support persistence laster
  // create index
  const repos = app.service.repo.list();

  const repoDirs = repos.map(repo => {
    const { baseDir } = app.service.repo.get(repo.dirId);
    return baseDir;
  });

  const createIndexPromiseInterator = repoDirs.map(baseDir => {
    return createIndex(app, { dir: baseDir });
  });

  // create index of mangas
  await Promise.all(createIndexPromiseInterator);

  // then start app
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

  // then start file change here
  new MangaWatcher({
    paths: repoDirs,

    onCreate: ({ baseDir, path }) => {
      // should create index to db   
      const dirId = app.service.repo.dirId(baseDir);
      app.service.manga.create(dirId, path).then((success) => {
        success && log(`${chalk.green('CREATE:')} ${path}`);
      })
    },

    onDelete: ({ baseDir, path }) => {
      // should remove index from db
      const dirId = app.service.repo.dirId(baseDir);
      app.service.manga.delete(dirId, path).then((success) => {
        success && log(`${chalk.red('DELETE:')} ${path}`);
      })
    },

    onRename: ({ baseDir, newPath, oldPath }) => {
      // should rename path in db
      const dirId = app.service.repo.dirId(baseDir);
      app.service.manga.rename(dirId, newPath, oldPath).then((success) => {
        success && log(`${chalk.yellow('RENAME:')} ${oldPath} -> ${newPath}`);
      });
    },

    onUpdate: ({ baseDir, path, props }) => {
      // should update props in db
      const dirId = app.service.repo.dirId(baseDir);
      app.service.manga.update(dirId, path, props).then((success) => {
        success && log(`${chalk.yellow(`UPDATE[${props}]:`)} ${path}`);
      });
    }
  }).run();

  return app;
};

function getHost() {
  const result = defaultGateway.v4.sync();
  const host = address.ip(result && result.interface);
  return host;
}

module.exports = start;