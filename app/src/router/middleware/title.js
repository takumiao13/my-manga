import { NAMESPACE as APP_NAMESPACE } from '@/store/modules/app';
import store from '@/store';
import { last } from '@/helpers/utils';
import platform from '@/helpers/platform';
import qs from '@/helpers/querystring';

export default async function title(ctx, next) {
	let title;

  if (['explorer', 'viewer'].indexOf(ctx.to.name) > -1) {
		title = 'MyManga';

		if (platform.isLaunchedFromHS() || platform.isWxBrowser()) {
			// skip;
		} else {
			const path = qs.decode(ctx.to.params.path);
			const { name: repoName } = store.getters[`${APP_NAMESPACE}/repo`];
			
			if (path) title = last(path.split('/'));
			if (repoName) title += ` - ${repoName}`
		}
	} else {
		title = ctx.to.meta.title || 'MyManga';
	}

	if (process.env.APP_MODE) {
		title = `[${process.env.APP_MODE}] ${title}`;
	}

	document.title = title;
  
  await next();
}