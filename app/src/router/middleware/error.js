import store from '@/store'
import { types as appTypes } from '@/store/modules/app';

export default async function error(ctx, next) {
  try {
    const { error } = store.state.app;

    // when app state is ERROR
    // the dist route is either error or login
    // redirect to error
    if (error) {
      if (error.code === 10200) {
        if (ctx.to.name !== 'login') ctx.redirect = '/login';
      } else {
        if (ctx.to.name !== 'error') ctx.redirect = '/error';
      }
    }

    // when manullay to error page with no ERROR
    // redirect to home
    if (!error && ctx.to.name === 'error') {
      ctx.redirect = '/'
    }
    await next();
  } catch (err) {
    // redirect to error
    ctx.redirect = '/error';
    store.commit(appTypes.setError, err);
  }  
}