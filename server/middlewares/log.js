const log4js = require('log4js');
const pathFn = require('../helpers/path');

module.exports = (app) => {
  const { dataDir } = app.config();

  log4js.configure({
    appenders: {
      out: { type: 'console' },
      app: {
        type: process.env.NODE_ENV === 'dev' ? 'console' : 'dateFile',
        filename: pathFn.join(dataDir, 'logs/app'),
        pattern: 'yyyy-MM-dd.log',
        alwaysIncludePattern: true,
      },
      access: {
        type: process.env.NODE_ENV === 'dev' ? 'console' : 'dateFile',
        filename: pathFn.join(dataDir, 'logs/access'),
        pattern: 'yyyy-MM-dd.log',
        alwaysIncludePattern: true,
        layout: {
          type: 'pattern',
          pattern: '%[[%x{user}] %d [%p%]] %c %x{data}',
          tokens: {
            user(logEvent) {
              const { ip, state: { auth } } = logEvent.data[0];
              
              // TODO: handle needAuth false
              if (!auth) {
                const err = new Error();
                err.message = `unknown user access [${ip}]`;
                throw err;
              }

              return auth.name;
            },
            data(logEvent) {
              const { method, url, status } = logEvent.data[0];
              return `${status} "${method} ${url}"`
            }
          }
        }
      }
    },
    categories: {
      default: { 
        appenders: ['out'], 
        level: 'debug' 
      },
      app: { 
        appenders: ['app'], 
        level: process.env.NODE_ENV === 'dev' ? 'info' : 'warn' 
      },
      visit: {
        appenders: ['app'], 
        level: 'info'
      },
      metadata: {
        appenders: ['app'], 
        level: 'warn'
      },
      access: { 
        appenders: ['access'], 
        level: process.env.NODE_ENV === 'dev' ? 'debug' : 'info' 
      }
    }
  });

  const logger = (category) => {
    const _logger = log4js.getLogger(category);
    return _logger;
  } 

  return async (ctx, next) => {
    ctx.logger = logger;
    await next();  
  }
}