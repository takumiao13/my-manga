import './assets/style/index.scss';

import Vue from 'vue'
import App from './App.vue'
import store, { resetStore, loadSettingsState } from './store';
import router, { backwardAllHistory } from './router';
import { byId, delay, inElectron, eventHub } from '@/helpers';
import config from '@/config';
import { types as settingTypes } from '@/store/modules/settings';

// Global components
import Spinner from './components/Spinner';
import Navbar from './components/Navbar';
import Toolbar from './components/Toolbar';
import SvgIcon from './components/SvgIcon';
import NestedList from './components/NestedList';
import SideToolbar from './components/SideToolbar';
import DataView from './components/DataView';
import Addressbar from './components/Addressbar';

// Third part components
import VueLazyload from 'vue-lazyload';
import VueQriously from 'vue-qriously';

// Directives
import loadingDirective from './directives/loading';

// Services
import $Service from '@/services';

Vue.component('spinner', Spinner);
Vue.component('navbar', Navbar);
Vue.component('toolbar', Toolbar);
Vue.component('icon', SvgIcon);
Vue.component('nested-list', NestedList);
Vue.component('side-toolbar', SideToolbar);
Vue.component('data-view', DataView);
Vue.component('addressbar', Addressbar);

Vue.directive('loading', loadingDirective);

Vue.use(VueQriously);
Vue.use(VueLazyload, {
  preLoad: 1.3,
  attempt: 1,
  lazyComponent: true
});

Vue.use($Service, {
  router,
  store
});

Vue.config.productionTip = false;

const $loading = byId('app-loading');
const $message = byId('app-message');
const REPO_KEY = '_REPO';

bootstrapApp();

function bootstrapApp() {

  if (inElectron) {
    const ipc = window.require('electron').ipcRenderer;
    // get real ip from electron
    ipc.on('app-config', (event, { host }) => {
      config.host = host;
    });
  
    window.onload = () => ipc.send('win-load');
  }

  eventHub.$on('store.reset', (repo) => {
    const { name, dirId } = repo;
    $message.innerHTML = '<p>Change Repository</p> <strong>' + name + '</strong>';
    document.body.style.overflow = 'hidden';
    $loading.classList.remove('fade');
    $loading.style.display = '';
    window.localStorage.setItem(REPO_KEY, dirId);

    backwardAllHistory(function() {
      resetStore();     
      router.push({ name: 'explorer', params: { dirId }});
      showApp();
    });
  });

  // try to get user settings
    Promise.all([
    store.dispatch(settingTypes.user.INIT),
    store.dispatch(settingTypes.repo.INIT)  
  ])
    .then(checkCurrentRepo)
    .then(render)
    .catch(error => {
      window.localStorage.removeItem(REPO_KEY);
      render({ error });
      console.error('setting error', error);
    });
}

function checkCurrentRepo() {
  const _REPO = window.localStorage.getItem(REPO_KEY);
  // check is has current repo
  if (_REPO) {
    const scope = _REPO;
    const repoSettings = store.state.settings[scope];
    // dynamic load repo settings
    if (!repoSettings) { return loadSettingsState(scope) }
  }
}

function render({ error } = {}) {
  showApp();
  new Vue({
    data: { error },
    router,
    store,
    render: h => h(App),
  }).$mount('#app');
}

function showApp() {
  delay(1000)
    .then(() => $loading.classList.add('fade'))
    .then(() => delay(1000))
    .then(() => {
      $loading.style.display = 'none';
      document.body.style.overflow = 'auto';
    }); 
}