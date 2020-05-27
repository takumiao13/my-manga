import store from '@/store';
import { NAMESPACE as SETTINGS_NAMESPACE } from '@/store/modules/settings';

// Views
import Login from '@/views/Login';
import Workbench from '@/views/Workbench';
import MangaList from '@/views/Workbench/Main/MangaList';
import Viewer from '@/views/Viewer';
import Repository from '@/views/Repository';
import ErrorView from '@/views/Error';

const routes = [
	{
		name: 'login',
		path: '/login',
		component: Login,
		meta: {
			title: 'LOGIN'
		}
	},

	{
		path: '/repo', 
		component: Workbench,
		children: [
			{ 
				name: 'explorer',  // -> manga
				path: ':dirId/manga/:path?', // fallback old route
				component: MangaList
			}
		]
	},

	{
		name: 'viewer',
		path: '/repo/:dirId/viewer/:type/:path/:ch?',
		component: Viewer,
		meta: {
			themeColor: '#333'
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
		name: 'error',
		path: '/error',
		component: ErrorView,
		meta: {
			title: 'ERROR'
		}
	},

	{
		name: 'home',
		path: '*', // handle not found
		redirect() {
			const userSettings = store.getters[`${SETTINGS_NAMESPACE}/user/settings`];
			const repo = store.getters[`${SETTINGS_NAMESPACE}/repo/repo`];

			return userSettings ? {
				name: 'repos'
			} : {
				name: 'explorer',
				params: { dirId: repo.dirId }
			}
		}
	}
];

export default routes;