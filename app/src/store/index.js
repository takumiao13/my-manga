import Vue from 'vue'
import Vuex from 'vuex'

// Load Modules
import appModule, { types as appTypes } from './modules/app';
import explorerModule from './modules/explorer';
import mangaModule from './modules/manga';
import viewerModule from './modules/viewer';
import settingsModule from './modules/settings';

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
  Object.keys(dynamicModules).forEach(key => store.unregisterModule(key));
}

function registerModules() {
  Object.keys(dynamicModules).forEach(key => {
    store.registerModule(key, dynamicModules[key]);
  });
}

export default store;

export function resetStore() {
  store.dispatch(appTypes.TOGGLE_SIDEBAR, { open: false });
  unregisterModules()
  registerModules()
}