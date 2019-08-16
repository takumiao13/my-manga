import './assets/style/index.scss';

import Vue from 'vue'
import App from './App.vue'
import store, { resetStore } from './store';
import router from './router';
import { byId, delay, inElectron } from '@/helpers';
import config from '@/config';
import { types as appTypes } from '@/store/modules/app';
import { types as settingTypes, createSettings, createTypes } from '@/store/modules/settings';

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

// Services
import $Service from '@/services';

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

Vue.use($Service, {
  router,
  store
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

  eventHub.$on('store.reset', (repo) => {
    const { name, dirId } = repo;
    $message.innerHTML = '<p>Change Repository</p> <strong>' + name + '</strong>';
    document.body.style.overflow = 'hidden';
    $loading.classList.remove('fade');
    $loading.style.display = '';
    window.localStorage.setItem('_REPO', dirId);

    backwardAllHistory(function() {
      resetStore();     
      router.push({ name: 'explorer', params: { dirId }});
      showApp();
    });
  });

  // just get user settings
  const _REPO = window.localStorage.getItem('_REPO');
  Promise.all([
    store.dispatch(settingTypes.user.INIT),
    store.dispatch(settingTypes.repo.INIT)  
  ]).then(() => {
    if (_REPO) {
      const scope = _REPO;
      const repoSettings = store.state.settings[scope];
      
      // dynamic load repo settings
      if (!repoSettings) {
        store.registerModule(['settings', scope], createSettings(scope))
        createTypes(scope);
        return store.dispatch(settingTypes[scope].INIT)
          .then(() => store.dispatch(appTypes.TOGGLE_REPO, { repo: scope }))
      }
    }
  }).then(() => {
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
  delay(1000)
    .then(() => $loading.classList.add('fade'))
    .then(() => delay(1000))
    .then(() => {
      $loading.style.display = 'none';
      document.body.style.overflow = 'auto';
    }); 
}

function backwardAllHistory(done) {
  const wrappedDone = () => {
    if (router.history.current.name !== 'repos') {
      // force fisrt history is `repos`
      router.replace({ name: 'repos' });
    }
    delete router._reset;
    done();
  }

  const delta = -window.history.length + router._startHistoryLength;
  
  if (router.canGoBack()) {
    // backward all history (we cannot clear it)
    router._reset = true;
    router._routerHistory = ['/'];

    window.history.go(delta);
    setTimeout(wrappedDone, 260);
  } else {
    done();
  }
}