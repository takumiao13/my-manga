import Vue from 'vue'
import routes from './routes';
import AppRouter from './app-router';
import { get } from '@/helpers/utils';

// Middleware
import titleMw from './middleware/title';
import historyMw from './middleware/history';
import themeColorMw from './middleware/theme-color';
import repoSettingsMw from './middleware/repo-setings';
import logMw from './middleware/log';
import errorMw from './middleware/error';
import authMw from './middleware/auth';

Vue.use(AppRouter);

const router = new AppRouter({
	routes,
	mode: 'hash',
	strict: process.env.NODE_ENV !== 'production',
	scrollBehavior (to, from, savedPosition) {
    const { isBack, resolver } = to.meta;
    
    // when only querystring change not scroll
    if (JSON.stringify(to.params) === JSON.stringify(from.params)) {
      return null
    }

    savedPosition || (savedPosition = { x: 0, y:0 });

    // when back from viewer to manga scroll to active page or chapter
    // logic is written in components
    if (from.name === 'viewer' && get(to, 'query.type') === 'manga') {
      return { x: 0, y: 0 };
    } else if (isBack && resolver) {	
      return new Promise((resolve) => {
        // set scroll position when data has fetched
        resolver.then(() => {
          setTimeout(() => resolve(savedPosition), 16);
        });
      });			
		} else {
      return savedPosition;
		}
  }
});

router
  .use(errorMw)
  .use(authMw)
  .use(logMw)
  .use(titleMw)
  .use(historyMw)
  .use(themeColorMw)
  .use(repoSettingsMw);

router.beforeEach(function(to, from, next) {
  const ctx = { to, from };
	router.handleBeforeEnter(ctx).then(() => {
    next(ctx.redirect);
  });
});

export default router;

export function resetHistory(done) {
  const wrappedDone = () => {
    // if the first history is not `repos` (etc. come from shared link)
    // force replace to `repos`
    if (router.history.current.name !== 'repos') {
      router.replace({ name: 'repos' });
    }

    // clear reset after back all history
    delete router._reset; 
    done();
  }

  router.popToRoot(router.canGoBack() ? wrappedDone : done);
}