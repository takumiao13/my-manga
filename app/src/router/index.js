import Vue from 'vue'
import store, { loadSettingsState } from '@/store';
import { types as appTypes, NAMESPACE as APP_NAMESPACE } from '@/store/modules/app';
import { last, isUndef } from '@/helpers/utils';
import routes from './routes';
import AppRouter, { historyName } from './app-router';

Vue.use(AppRouter);

const router = new AppRouter({
	routes,
	mode: 'hash',
	strict: process.env.NODE_ENV !== 'production',
	scrollBehavior (to, from, savedPosition) {
    const { name, isBack, scrollPromise } = to.meta;
    savedPosition || (savedPosition = { x: 0, y:0 });
    
		if (isBack && scrollPromise) {	
      return new Promise((resolve) => {
        // set scroll position when data has fetched
        scrollPromise.then(() => {
          setTimeout(() => resolve(savedPosition), 16);
        });
      });			
		} else {
			return name !== 'viewer' && savedPosition;
		}
  }
});

router.beforeEach(function(to, from, next) {
	const history = router._routerHistory;
	const delta = router._backdelta;

	// handle reset when change repo
	if (router._reset) {
		to.meta.isBack = false;

	// handle navigate back delta
	} else if (delta) {
		history.splice(history.length - delta, delta);
		to.meta.isBack = true;
		router._backdelta = undefined;

	// handle browser back
	} else if (isUndef(router._push) && historyName(to) === last(history)) {
		history.splice(history.length - 1, 1);
		to.meta.isBack = true;
	
	// forward
	} else if (!router._replace) {
		const p = historyName(from);
		if (p !== '/' || (p === '/' && history.length === 0)) {
			history.push(p);
		}

		if (from.name == 'repos' && to.name == 'explorer') {
			// shouldn't fetch again when repo has not changed
			to.meta.isBack = (store.state.manga.inited && to.params.dirId === store.state.app.repoId);
		} else {
			to.meta.isBack = false;
		}
	}

	// hack for something ... :(
	delete router._push;
	delete router._replace;

	// change doc title
	if (['explorer', 'viewer'].indexOf(to.name) > -1) {
		let title = 'My Manga';
		const { path } = to.params;
		const { name: repoName } = store.getters[`${APP_NAMESPACE}/repo`];
		
		if (path) title = last(path.split('/'));
		if (repoName) title += ` - ${repoName}`

		document.title = title;
	} else {
		document.title = to.meta.title || 'My Manga';
	}

	// change mobile top theme color
	const meta = document.querySelector('[name="theme-color"]');
	// @XXX need to optimze
	meta.content = to.meta.themeColor || '#fff';

	// check repo settings
	if (['explorer', 'viewer'].indexOf(to.name) > -1) {
		const { dirId } = to.params;
		const scope = dirId;
		const repoSettings = store.state.settings[scope];

		// dynamic load repo settings
		if (isUndef(repoSettings)) {
			// when repo settings is undef force `isBack` false
			// need check repo path first then create store;
			to.meta.isBack = false; 
			loadSettingsState(scope).then($next).catch($next);
		} else {
			if (store.state.app.repoId !== scope) {
				store.dispatch(appTypes.TOGGLE_REPO, { repo: scope }).then($next)
			} else {
				$next();
			}
		}
	} else {
		$next();
	}

	// wrap original next to handle app error
	function $next(err) {
    if (err) return store.dispatch(appTypes.ERROR, err).then(next);
    
		const appError = store.state.app.error;
    if (appError) return store.dispatch(appTypes.ERROR, null).then(next);
    
    next();
	}

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