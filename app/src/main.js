import './assets/style/index.scss';
import './registerServiceWorker';

import Vue from 'vue';
import App from './App.vue';
import config from '@/config';

// Helpers
import { byId, getScript } from '@/helpers/dom';
import { delay } from '@/helpers/promise';
import platform from '@/helpers/platform';
import EventEmitter from '@/helpers/eventemitter';

// Store & Router (router is depend on store, so must after it)
import store, { resetStore, loadSettingsState } from '@/store';
import { types as appTypes } from '@/store/modules/app';
import { types as settingTypes } from '@/store/modules/settings';
import router, { resetHistory } from '@/router';

// Global components
import Spinner from '@/components/Spinner';
import Navbar from '@/components/Navbar';
import Toolbar from '@/components/Toolbar';
import SvgIcon from '@/components/SvgIcon';
import NestedList from '@/components/NestedList';
import SideToolbar from '@/components/SideToolbar';
import DataView from '@/components/DataView';
import Addressbar from '@/components/Addressbar';
import Dropdown from '@/components/Dropdown';
import VideoPlayer from '@/components/VideoPlayer';

// Third part components
import VueLazyload from 'vue-lazyload';
import VueQriously from 'vue-qriously';

// Directives
import loadingDirective from '@/directives/loading';
import clickOutSideDirective from '@/directives/click-out-side';

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
Vue.component('dropdown', Dropdown);
Vue.component('video-player', VideoPlayer);

Vue.directive('loading', loadingDirective);
Vue.directive('click-out-side', clickOutSideDirective);

Vue.use(VueQriously);
Vue.use(VueLazyload, {
  preLoad: 1.5,
  attempt: 1,
  observer: true, // when image in slot observer is need.
  adapter: {
    loaded ({ bindType, el, naturalHeight, naturalWidth, $parent, src, loading, error, Init }) {
      // handle manga cover loaded
      if (el.classList.contains('cover-image')) {        
        el.parentNode.classList.remove('loading');
        el.parentNode.classList.add('loaded');
      }  
    }
  }
});

Vue.use($Service, {
  router,
  store
});

Vue.config.productionTip = process.env.NODE_ENV === 'production';

const $loading = byId('app-loading');
const $message = byId('app-message');
const REPO_KEY = '_REPO';

bootstrapApp();

function bootstrapApp() {
  let hideSplashScreen;

  // not show custom splash screen when lanuched form pwa
  if (platform.isLaunchedFromHS()) {
    $loading.style.display = 'none';
    document.body.style.overflow = '';
  } else {
    hideSplashScreen = showSplashScreen();
  }

  if (platform.isElectron()) {
    const ipc = window.require('electron').ipcRenderer;
    // get real ip from electron
    ipc.on('app-config', (event, { host }) => {
      config.api.HOST = host;
    });
  
    window.onload = () => ipc.send('win-load');
  }

  // Add To Home Screen
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    store.commit(appTypes.PWA_INSTALL_PROMPT, {
      pwaInstallPrompt: e
    });
  });

  EventEmitter.$on('store.reset', (repo) => {
    const { name, dirId } = repo;
    
    // style
    document.body.style.overflow = 'hidden';
    $loading.classList.remove('fade');
    $loading.style.display = '';
    $message.innerHTML = '<p>Change Repository</p> <strong>' + name + '</strong>';
    
    // store repo key
    window.localStorage.setItem(REPO_KEY, dirId);

    // reset store
    resetHistory(() => {
      resetStore();
      router.push({ name: 'explorer', params: { dirId }});
      // delay 1000 ms wait fetch data to render view 
      delay(1000).then(() => {
        const hide = showSplashScreen();
        hide(); // hide self
      })
    });
  });

  // try to get user settings
  Promise.all([
    store.dispatch(settingTypes.user.INIT),
    store.dispatch(settingTypes.repo.INIT)  
  ])
    .then(checkCurrentRepo)
    .then(() => {
      renderApp();
      // wait for data fetch
      delay(1000).then(hideSplashScreen);
    })
    .catch(error => {
      window.localStorage.removeItem(REPO_KEY);
      renderApp({ error });
      hideSplashScreen();
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

function renderApp({ error } = {}) {
  new Vue({
    data: { error },
    router,
    store,
    render: h => h(App),
  }).$mount('#app');
}

function showSplashScreen() {
  document.body.style.overflow = 'hidden';
  $loading.style.display = '';

  return function hide() {
    Promise.resolve()
      .then(() => {
        $loading.classList.add('fade');
        document.body.style.overflow = ''; // allow scroll
        return delay(500) // transition-duration is 300s
      })
      .then(() => {
        $loading.style.display = 'none';
      });
  }
}