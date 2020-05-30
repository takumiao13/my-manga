import store from '@/store'

export default async function auth(ctx, next) {
  const { user, error } = store.state.app
  const { token, needAuth } = user;

  // when app error just pass it
  // since we cannot get user info
  if (error) {
    await next();
    return;
  }

  // need auth check
  if (needAuth) {
    // to login page
    if (ctx.to.path === '/login') {
      if (token) {
        ctx.redirect = '/';
        await next(); // redirect to home
      } else {
        await next(); // pass it
      }
    } else {
      if (token) {
        await next();
      } else {
        ctx.redirect = '/login';
        await next(); // redirect to login
      }
    }

  // pass auth check
  } else {
    if (ctx.to.path === '/login') {
      ctx.redirect = '/';
      await next(); // redirect to home
    } else {
      await next(); // pass it
    }
  }
}