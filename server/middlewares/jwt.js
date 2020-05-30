const jwtMw = require('koa-jwt');

module.exports = (app) => {
  const { auth } = app.config();

  // pass auth check
  if (!auth) {
    return async (ctx, next) => {
      await next();
    }
  } else {
    return jwtMw({ 
      secret: 'hello-mymanga',
      key: 'auth',
      getToken: (ctx, opts) => {
        if (ctx.header && ctx.header.authorization) {
          return resolveAuthorizationHeader(ctx, opts);
        } else {
          return resolveAccessTokenParams(ctx, opts);
        }
      },
    }).unless({ 
      // protected `api/*` and `img`
      path: [ 
        /^\/$/, 
        /^\/index\.html$/, 
        /^\/assets\//, 
        /^\/mode\//,
        /^\/service-worker\.js/,
        /^\/manifest\.json/,
        /^\/precache-manifest/, 
        /^\/api\/settings/,
        /^\/api\/login/
      ] 
    });
  }
}

function resolveAccessTokenParams(ctx, opts) {
  if (ctx.query.access_token) {
    return ctx.query.access_token;
  }

  if (!opts.passthrough) {
    ctx.throw(401, 'Bad access_token query params.');
  }
}

function resolveAuthorizationHeader(ctx, opts) {
  const parts = ctx.header.authorization.split(' ');

  if (parts.length === 2) {
      const scheme = parts[0];
      const credentials = parts[1];

      if (/^Bearer$/i.test(scheme)) {
          return credentials;
      }
  }
  if (!opts.passthrough) {
      ctx.throw(401, 'Bad Authorization header format. Format is "Authorization: Bearer <token>"');
  }
};