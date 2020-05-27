import store, { loadSettingsState } from '@/store';
import { types as appTypes } from '@/store/modules/app';
import { isUndef } from '@/helpers/utils';

export default async function repoSettings(ctx, next) {
  const { to, redirect } = ctx;

  if (!redirect && ['explorer', 'viewer'].indexOf(to.name) > -1) {
		const { dirId } = to.params;
		const scope = dirId;
		const repoSettings = store.state.settings[scope];

    // dynamic load repo settings if not exists.
    // when repo settings is undef force `isBack` false
		// need check repo path first then create store;
		if (isUndef(repoSettings)) {
      to.meta.isBack = false; 
      await loadSettingsState(scope).then(next)

    // if changed repo is exists
    // check current `repoId` is match `repoSettings`
    // if no matched, just toggle it.
		} else if (store.state.app.repoId !== scope) {
      store.commit(appTypes.TOGGLE_REPO, { repo: scope });
      await next();
		}
	} else {
		await next();
  }
}
