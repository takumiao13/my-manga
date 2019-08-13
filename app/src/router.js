import Vue from 'vue'
import store from './store';
import VueRouter from 'vue-router';
import { last, isDef } from '@/helpers';

// views
import MainInterface from '@/views/MainInterface';
import MangaList from '@/views/MainInterface/MangaList';
import Viewer from '@/views/Viewer';
import Repository from '@/views/Repository';

// extend router
VueRouter.prototype._routerHistory = []; // sync browser history
VueRouter.prototype.navigate = function(to) {
	const route = this.match(to);
	const index = this._routerHistory.indexOf(historyName(route));

	if (index > -1) {
		this._backdelta = this._routerHistory.length - index;
		this.go(-this._backdelta);
	} else {
		this.push(to);
	}
};

Vue.use(VueRouter);

// initialize router
const routes = [
	{
		path: '/',
		redirect: 'manga'
	},
	{
		path: '/manga', 
		component: MainInterface,
		children: [
			{ 
				name: 'explorer', 
				path: ':path?', 
				component: MangaList
			}
		]
	},
	{
		name: 'viewer',
		path: '/viewer/:path/:ch?',
		component: Viewer,
		meta: {
			themeColor: '#000'
		}
	},
	{
		name: 'repos',
		path: '/repos',
		component: Repository
	},
	{
		path: '*', // handle not found
		redirect: 'manga'
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
					to.meta.scrollPromise.then(() => {
						console.log(savedPosition);
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

	console.log('beforeEach', to);
	
	// handle reset when change repo
	if (router._reset) {
		history.push('/')
		to.meta.isBack = false;
		delete router._reset;

	// has back delta
	} else if (delta) {
		history.splice(history.length - delta, delta);
		to.meta.isBack = true;
		router._backdelta = undefined;

	// is back
	} else if (isDef(router._isBack)) {
		to.meta.isBack = router._isBack;
		delete router._isBack;

	} else if (history.length && historyName(to) === last(history)) {
		history.splice(history.length - 1, 1);
		to.meta.isBack = true;
	
	// forward
	} else {
		const p = historyName(from);
		if (p !== '/' || (p === '/' && history.length === 0)) {
			history.push(p);
		}
		to.meta.isBack = false;
	}

	// change doc title
	if (['explorer', 'viewer'].indexOf(to.name) > -1) {
		let title = 'My Manga';
		const { path } = to.params;
		const repoName = store.getters['settings/user/repoName'];
		
		if (path) title = last(path.split('/'));
		if (repoName) title += ` - ${repoName}`

		document.title = title;
	}

	// change mobile top theme color
	const meta = document.querySelector('[name="theme-color"]');
	// @XXX need to optimze
	meta.content = to.meta.themeColor || '#fff';

	console.log(history);
	next();
});


function historyName(route) {
	return decodeURIComponent(route.fullPath);
}

export default router;