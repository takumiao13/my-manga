import Vue from 'vue'
import routes from './routes';
import AppRouter from './app-router';

// Middleware
import titleMw from './middleware/title';
import historyMw from './middleware/history';
import themeColorMw from './middleware/theme-color';
import repoSettingsMw from './middleware/repo-setings';
import logMw from './middleware/log';
import errorMw from './middleware/error';

Vue.use(AppRouter);

const router = new AppRouter({
	routes,
	mode: 'hash',
	strict: process.env.NODE_ENV !== 'production',
	scrollBehavior (to, from, savedPosition) {
    const { name, isBack, resolver } = to.meta;
    savedPosition || (savedPosition = { x: 0, y:0 });
    
		if (isBack && resolver) {	
      return new Promise((resolve) => {
        // set scroll position when data has fetched
        resolver.then(() => {
          setTimeout(() => resolve(savedPosition), 16);
        });
      });			
		} else {
			return name !== 'viewer' && savedPosition;
		}
  }
});

router
	.use(errorMw)
	.use(logMw)
	.use(titleMw)
	.use(historyMw)
	.use(themeColorMw)
	.use(repoSettingsMw);

router.beforeEach(function(to, from, next) {
	router.handleBeforeEnter(to, from).then(next);
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