const log4js = require('log4js');
const pathFn = require('../helpers/path');

module.exports = (app) => {
  const { dataDir, auth: needAuth } = app.config();

  log4js.configure({
    appenders: {
      out: { type: 'console' },
      app: {
        type: process.env.NODE_ENV === 'development' ? 'console' : 'dateFile',
        filename: pathFn.join(dataDir, 'logs/app'),
        pattern: 'yyyy-MM-dd.log',
        alwaysIncludePattern: true,
      },
      access: {
        type: process.env.NODE_ENV === 'development' ? 'console' : 'dateFile',
        filename: pathFn.join(dataDir, 'logs/access'),
        pattern: 'yyyy-MM-dd.log',
        alwaysIncludePattern: true,
        layout: {
          type: 'pattern',
          pattern: '%[[%x{user}] %d [%p%]] %c %x{data}',
          tokens: {
            user(logEvent) {
              const { ip, state } = logEvent.data[0];
              
              if (!needAuth) {
                return ip;
              }

              if (needAuth && !state.auth) {
                const err = new Error();
                err.message = `unknown user access [${ip}]`;
                throw err;
              }

              return state.auth.name;
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
        level: process.env.NODE_ENV === 'development' ? 'debug' : 'info' 
      },
      visit: {
        appenders: ['app'], 
        level: 'info'
      },
      metadata: {
        appenders: ['app'], 
        level: 'warn'
      },
      compress: {
        appenders: ['app'],
        level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
      },
      access: { 
        appenders: ['access'], 
        level: process.env.NODE_ENV === 'development' ? 'debug' : 'info' 
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