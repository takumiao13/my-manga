import './assets/style/index.scss';

import Vue from 'vue'
import App from './App.vue'
import store, { resetStore } from './store';
import router from './router';
import { byId, delay, inElectron } from '@/helpers';
import config from '@/config';
import { types } from '@/store/modules/settings';

// Global components
import Spinner from './components/Spinner';
import Navbar from './components/Navbar';
import Toolbar from './components/Toolbar';
import SvgIcon from './components/SvgIcon';
import NestedList from './components/NestedList';
import SideToolbar from './components/SideToolbar';
import DataView from './components/DataView';
import Breadcrumb from './components/Breadcrumb';

// Third part components
import VueLazyload from 'vue-lazyload';
import VueQriously from 'vue-qriously';

// Directives
import loadingDirective from './directives/loading';
import { eventHub } from './helpers';

Vue.component('spinner', Spinner);
Vue.component('navbar', Navbar);
Vue.component('toolbar', Toolbar);
Vue.component('icon', SvgIcon);
Vue.component('nested-list', NestedList);
Vue.component('side-toolbar', SideToolbar);
Vue.component('data-view', DataView);
Vue.component('breadcrumb', Breadcrumb);

Vue.directive('loading', loadingDirective);

Vue.use(VueQriously);
Vue.use(VueLazyload, {
  preLoad: 1.3,
  attempt: 1,
  lazyComponent: true
});

Vue.config.productionTip = false;

const $loading = byId('app-loading');
const $message = byId('app-message');

bootstrapApp();

function bootstrapApp() {

  if (inElectron) {
    const ipc = window.require('electron').ipcRenderer;
    ipc.on('app-config', (event, { host }) => {
      config.host = host;
    });
  
    window.onload = () => ipc.send('win-load');
  }

  eventHub.$on('store.reset', ({ repoName }) => {
    $message.innerHTML = 'Change Repository <br/> <strong>' + repoName + '</strong>';
    document.body.style.overflow = 'hidden';
    $loading.classList.remove('fade');
    $loading.style.display = '';

    backwardAllHistory();

    setTimeout(() => {
      resetStore();
      // change repo settings
      store.dispatch(types.repo.INIT).then(showApp);
    }, 1000); 
  });

  Promise.all(
    ['user', 'repo'].map(scope => store.dispatch(types[scope].INIT))
  ).then(() => {
    const userSettings = store.getters['settings/user/settings'];

    // should go to select repo
    if (userSettings && !userSettings.baseDir) {
      window.history.replaceState(null, null, '#/repos');
    }

    render();
    showApp();
  }).catch((err) => {
    console.error('setting error', err);
  });
}

function render() {
  new Vue({
    router,
    store,
    render: h => h(App),
  }).$mount('#app');
}

function showApp() {
  delay(2000)
  .then(() => $loading.classList.add('fade'))
  .then(() => delay(1000))
  .then(() => {
    $loading.style.display = 'none';
    document.body.style.overflow = 'auto';
  }); 
}

function backwardAllHistory() {
  // backward all history (we cannot clear it)
  router._reset = true;
  router._routerHistory = [];
  const delta = -window.history.length + router._startHistoryLength;
  window.history.go(delta)
}