import Vue from 'vue';
import Vuex from 'vuex';

import { errorCodeMap, ERR_CODE } from '@/helpers/error';

// Load Modules
import appModule, { types as appTypes } from './modules/app';
import settingsModule, { 
  types as settingTypes, 
  NAMESPACE as SETTINGS_NAMESPACE,
  createTypes, 
  createSettings 
} from './modules/settings';

import explorerModule from './modules/explorer';
import mangaModule, { cacheStack as mangaCacheStack } from './modules/manga';
import viewerModule from './modules/viewer';

Vue.use(Vuex);

const staticModules = {
  app: appModule,
  settings: settingsModule
};

const dynamicModules = {
  explorer: explorerModule,
  manga: mangaModule,
  viewer: viewerModule
};

const store = new Vuex.Store({
  modules: staticModules
});

registerModules();

function unregisterModules() {
  Object.keys(dynamicModules).forEach(key => {
    store.unregisterModule(key);
  });
}

function registerModules() {
  Object.keys(dynamicModules).forEach(key => {
    // re-create module
    const mod = dynamicModules[key]();
    store.registerModule(key, mod);
  });
}

export default store;

export function resetStore() {
  store.commit(appTypes.toggleAside, false);
  store.commit(appTypes.toggleSidebar, true);
  store.commit(appTypes.setActivity);
  mangaCacheStack.clear();
  unregisterModules();
  registerModules();
}

export const loadSettingsState = (scope) => {
  // first we should check the scope is valid or not
  const repos = store.getters[`${SETTINGS_NAMESPACE}/user/repos`];
  const isExists = repos ? repos.map(repo => repo.dirId).indexOf(scope) > -1 : true;
  
  if (!isExists) {
    const code = ERR_CODE.REPO_UNACCESSED;
    const error = errorCodeMap[code];
    store.commit(appTypes.setRepoId, '');
    return Promise.reject(Object.assign(error, { code }))
  }

  // register nested settings state
  const settingsState = createSettings(scope);
  settingTypes[scope] = createTypes(scope);
  store.registerModule(['settings', scope], settingsState);
  return store.dispatch(settingTypes[scope].INIT)
    .then(() => store.commit(appTypes.setRepoId, scope))
}