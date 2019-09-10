import Vue from 'vue'
import store, { loadSettingsState } from './store';
import VueRouter from 'vue-router';
import { last, isUndef, eventHub } from '@/helpers';
import { types as appTypes } from '@/store/modules/app';
import { types as settingTypes, createSettings, createTypes } from '@/store/modules/settings';

// views
import MainInterface from '@/views/MainInterface';
import Explorer from '@/views/MainInterface/Explorer';
import MangaList from '@/views/MainInterface/MangaList';
import Viewer from '@/views/Viewer';
import Repository from '@/views/Repository';
import ServerError from '@/views/Error/ServerError';

// extend router
VueRouter.prototype._routerHistory = []; // sync browser history
VueRouter.prototype.navigate = function(to) {
	const route = this.match(to);
	const index = this._routerHistory.lastIndexOf(historyName(route));

	if (index > -1) {
		this._backdelta = this._routerHistory.length - index;
		this.go(-this._backdelta);
	} else {
		this.push(to);
	}
};

const routerPush = VueRouter.prototype.push;
const routerReplace = VueRouter.prototype.replace;

VueRouter.prototype.push = function() {
	this._push = true;
	routerPush.apply(this, arguments);
}

VueRouter.prototype.replace = function() {
	this._replace = true;
	routerReplace.apply(this, arguments);
}

VueRouter.prototype.canGoBack = function() {
	return this._routerHistory.length > 1;
}

Vue.use(VueRouter);

// initialize router
const routes = [
	{
		path: '/manga', 
		component: MainInterface,
		children: [
			{ 
				name: 'explorer', 
				path: ':dirId/:path?', 
				components: {
					sidebar: Explorer,
          main: MangaList
				}
			}
		]
	},
	{
		name: 'viewer',
		path: '/viewer/:dirId/:path/:ch?',
		component: Viewer,
		meta: {
			themeColor: '#000'
		}
	},
	{
		name: 'repos',
		path: '/repos',
		component: Repository,
		meta: {
			title: 'REPOSITORY'
		}
	},
	{
		name: 'home',
		path: '*', // handle not found
		redirect() {
			const userSettings = store.getters['settings/user/settings'];
			const repo = store.getters['settings/repo/repo'];
			
			if (userSettings) return 'repos';

			return {
				name: 'explorer',
				params: { dirId: repo.dirId }
			}
		}
	}
];
const router = new VueRouter({
	routes,
	mode: 'hash',
	strict: process.env.NODE_ENV !== 'production',
	scrollBehavior (to, from, savedPosition) {
		savedPosition || (savedPosition = { x: 0, y:0 })
		if (to.meta.isBack) {
			if (to.meta.scrollPromise) {
				return new Promise((resolve) => {
					// set scroll position when data has fetched
					to.meta.scrollPromise.then(() => {
						setTimeout(() => resolve(savedPosition), 16);
					});
				});
			} else {
				return to.name !== 'viewer' && savedPosition;
			}
		} else {
			return to.name !== 'viewer' && savedPosition;
		}
  }
});

// sync history to rotuer
const RH = '_RH';
const SHL = '_SHL';
const sess = window.sessionStorage;

router._routerHistory = JSON.parse(sess.getItem(RH) || '[]');
router._startHistoryLength = +sess.getItem(SHL) || window.history.length;

window.onbeforeunload = () => {
	// store history when refresh
	sess.setItem(RH, JSON.stringify(router._routerHistory));
	sess.setItem(SHL, router._startHistoryLength);
};

router.beforeEach(function(to, from, next) {
	const history = router._routerHistory;
	const delta = router._backdelta;
	console.log('beforeEach', to, 'from', from);

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
		const { name: repoName } = store.getters['app/repo'];
		
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

	console.log(history);
});


function historyName(route) {
	return decodeURIComponent(route.fullPath);
}

export default router;


export function backwardAllHistory(done) {
  const wrappedDone = () => {
    if (router.history.current.name !== 'repos') {
      // force fisrt history is `repos`
      router.replace({ name: 'repos' });
    }
    delete router._reset;
    done();
  }

  const delta = -window.history.length + router._startHistoryLength;
  
  if (router.canGoBack()) {
    // backward all history (we cannot clear it)
    router._reset = true;
    router._routerHistory = ['/'];

    window.history.go(delta);
    setTimeout(wrappedDone, 260);
  } else {
    done();
  }
}