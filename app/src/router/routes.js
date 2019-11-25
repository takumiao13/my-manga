import Workbench from '@/views/Workbench';
import MangaList from '@/views/Workbench/Main/MangaList';
import Viewer from '@/views/Viewer';
import Repository from '@/views/Repository';

import { NAMESPACE as SETTINGS_NAMESPACE } from '@/store/modules/settings';

import store from '../store';

const routes = [
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
		path: '/viewer/:dirId/:path/:ch?',
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
		name: 'home',
		path: '*', // handle not found
		redirect() {
			const userSettings = store.getters[`${SETTINGS_NAMESPACE}/user/settings`];
			const repo = store.getters[`${SETTINGS_NAMESPACE}/repo/repo`];
			
			if (userSettings) return 'repos';

			return {
				name: 'explorer',
				params: { dirId: repo.dirId }
			}
		}
	}
];

export default routes;