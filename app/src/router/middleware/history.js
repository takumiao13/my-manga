import store from '@/store';
import { isUndef, last } from '@/helpers/utils';
import { historyName } from '../app-router';

export default async function history(ctx, next) {
  const { router, to, from } = ctx;
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
			to.meta.isBack = (
        store.state.manga.inited && 
        to.params.dirId === store.state.app.repoId
      );
		} else {
			to.meta.isBack = false;
		}
	}

	// hack for something ... :(
	delete router._push;
  delete router._replace;
  
  await next();
}