const cors = require('koa2-cors');

module.exports = ({ options }) => {
  if (!options.cors) {
    return async (ctx, next) => {
      await next();
    }
  } else {
    return cors({
      origin: (ctx) => checkOriginAgainstWhitelist(ctx, options),
      maxAge: 5,
      credentials: true,
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowHeaders: [
        'X-APP-VERSION',
        'X-APP-STARTAT'
      ],
    });
  }
}

function checkOriginAgainstWhitelist(ctx, options) {
  const requestOrigin = ctx.accept.headers.origin;
  const { cors } = options;

  if (cors === true) return requestOrigin;

  if (typeof cors === 'object') {
    if (cors.whitelist) {
      if (!cors.whitelist.includes(requestOrigin)) {
        return false;
      }
      return requestOrigin;
    } else {
      return requestOrigin;
    }
  }
}