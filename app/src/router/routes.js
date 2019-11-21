import MainInterface from '@/views/MainInterface';
import Explorer from '@/views/MainInterface/Explorer';
import MangaList from '@/views/MainInterface/MangaList';
import Viewer from '@/views/Viewer';
import Repository from '@/views/Repository';

import { NAMESPACE as SETTINGS_NAMESPACE } from '@/store/modules/settings';

import store from '../store';

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