const App = require('../server');
const logger = require('./logger');
const chalk = require('chalk');

function indexing(args = {}) {
  const { create, drop, dir: baseDir } = args;
  const app = new App({ baseDir });

  app.setup().then(() => {
    if (create) {
      return createIndex(app, args);
    }

    if (drop) {
      return dropIndex(app, args);
    }
  });
}

function createIndex(app, { dir }) {
  logger.log(`[${dir}] Start to create index`);
  return app.service.manga.createIndex(dir, (err, data) => {
    if (err) {
      logger.error(`[${dir}]`);
      logger.error(`Create Index Error`);
      logger.error(` - ${err}`);
      return;
    }

    const { dirId, elapsed, count } = data;
    logger.log('--------------------');
    logger.log(`Create Index success [${dir}]`);
    logger.log(` - dirId: ${chalk.green(dirId)}`)
    logger.log(` - elapsed: ${chalk.green(elapsed)}`);
    logger.log(` - count: ${chalk.green(count)}`);
    
  });
}

function dropIndex(app, { dir }) {
  return app.service.manga.dropIndex(dir, (err, data) => {
    if (err) {
      logger.error(`Drop Index Error [${dir}]`);
      logger.error(` - ${err}`);
      return
    }

    logger.log(`Drop Index success [${dir}]`)
  });
}

indexing.createIndex = createIndex;
indexing.dropIndex = dropIndex;

module.exports = indexing;