import { NAMESPACE as APP_NAMESPACE } from '@/store/modules/app';
import store from '@/store';
import { last } from '@/helpers/utils';

export default async function title(ctx, next) {

  if (['explorer', 'viewer'].indexOf(ctx.to.name) > -1) {
		let title = 'My Manga';
		const { path } = ctx.to.params;
		const { name: repoName } = store.getters[`${APP_NAMESPACE}/repo`];
		
		if (path) title = last(path.split('/'));
		if (repoName) title += ` - ${repoName}`

		document.title = title;
	} else {
		document.title = ctx.to.meta.title || 'My Manga';
  }
  
  await next();
}