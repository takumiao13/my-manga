const corsMw = require('koa2-cors');

module.exports = (app) => {
  const { cors } = app.config('server');
  if (!cors) {
    return async (ctx, next) => {
      await next();
    }
  } else {
    return corsMw({
      origin: (ctx) => checkOriginAgainstWhitelist(ctx, cors),
      maxAge: 5,
      credentials: true,
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowHeaders: [
        'Range',
        'X-APP-VERSION',
        'X-APP-STARTAT',
        'Content-Type',
        'Authorization'
      ],
    });
  }
}

function checkOriginAgainstWhitelist(ctx, cors) {
  const requestOrigin = ctx.accept.headers.origin;

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