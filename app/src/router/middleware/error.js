import store from '@/store'
import { types as appTypes } from '@/store/modules/app';

export default async function error(ctx, next) {
  try {
    await next();
    // hanle error
    // if not error we should reset `app.error` to null.
    const appError = store.state.app.error;
    if (appError) {
      await store.commit(appTypes.ERROR, null);
    }
  } catch (err) {
    console.error(err);
    await store.commit(appTypes.ERROR, err);
  }
  
  
  // TODO: Refractor. (has problem)
  
}