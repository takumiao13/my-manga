import './assets/style/index.scss';
import './registerServiceWorker';

import Vue from 'vue';
import App from './App.vue';
import config from '@/config';
import consts from '@/consts';

// Helpers
import { byId } from '@/helpers/dom';
import { delay } from '@/helpers/promise';
import feature from '@/helpers/feature';
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
import Modal from '@/components/Modal';
import Switcher from '@/components/Switcher';

// Third part components
import VueLazyload from 'vue-lazyload';
import VueQriously from 'vue-qriously';
import VueNotifications from 'vue-notification';
import { Swiper, EffectFade, Lazy } from 'swiper';
import VueAwesomeSwiper from 'vue-awesome-swiper';
import 'swiper/swiper-bundle.css'; // If you use Swiper 6.0.0 or higher

// Directives
import loadingDirective from '@/directives/loading';
import clickOutSideDirective from '@/directives/click-out-side';

// Filters
import verNameFilter from '@/filters/verName';
import dateFormatFilter from '@/filters/dateFormat';

// Services
import $Service from '@/services';

Vue.component('Spinner', Spinner);
Vue.component('Navbar', Navbar);
Vue.component('Toolbar', Toolbar);
Vue.component('Icon', SvgIcon);
Vue.component('NestedList', NestedList);
Vue.component('SideToolbar', SideToolbar);
Vue.component('DataView', DataView);
Vue.component('Addressbar', Addressbar);
Vue.component('Dropdown', Dropdown);
Vue.component('VideoPlayer', VideoPlayer);
Vue.component('Modal', Modal);
Vue.component('Switcher', Switcher);

Vue.directive('loading', loadingDirective);
Vue.directive('click-out-side', clickOutSideDirective);

Vue.filter('verName', verNameFilter);
Vue.filter('dateFormat', dateFormatFilter);

Vue.use(VueQriously);
Vue.use(VueLazyload, {
  preLoad: 1,
  attempt: 2,
  observer: true, // when image in slot observer is need.
  adapter: {
    loaded({ el }) {
      // handle manga cover loaded
      if (el.classList.contains('cover-image')) {        
        el.parentNode.classList.remove('loading');
        el.parentNode.classList.add('loaded');
      }  
    }
  }
});
Vue.use(VueNotifications);
Vue.use(VueAwesomeSwiper);

Swiper.use([EffectFade, Lazy]);
Vue.use(VueAwesomeSwiper);

Vue.use($Service, { router, store });
Vue.prototype.$platform = platform;
Vue.prototype.$feature = feature;
Vue.prototype.$config = config;
Vue.prototype.$consts = consts;

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
    store.commit(appTypes.setPwaInstallPrompt, e);
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
    resetStore();

    // reset history
    resetHistory(() => {
      // after reset check current page is repos or not 
      // (the first page is not `repos` from shared link)
      if (router.history.current.name === 'repos') {
        enterNewRepo(dirId);
      } else {
        // redirect to repos pages
        router.replace({ name: 'repos' }, () => {
          enterNewRepo(dirId);
        })
      }
    });

    function enterNewRepo(dirId) {
      router.push({ name: 'explorer', params: { dirId }});
      // delay 1000 ms wait fetch data to render view 
      delay(1000).then(() => {
        const hide = showSplashScreen();
        hide(); // hide self
      })
    }
  });


  // TODO: uppercase ??
  store.dispatch(appTypes.checkUser)
    // try to get user settings
    .then(() => Promise.all([
        store.dispatch(settingTypes.user.init),
        store.dispatch(settingTypes.repo.init)  
      ])
    )
    .then(checkCurrentRepo)
    .then(() => {
      renderApp();
      // wait for data fetch
      delay(1000).then(hideSplashScreen);
    })
    .catch(error => {
      window.localStorage.removeItem(REPO_KEY);
      renderApp();
      hideSplashScreen();
      console.error('App Bootstrap Error', error);
    });
}

function checkCurrentRepo() {
  const REPO = window.localStorage.getItem(REPO_KEY);

  // check is current repo
  if (REPO) {
    const scope = REPO;
    const repoSettings = store.state.settings[scope];
    // dynamic load repo settings
    if (!repoSettings) { return loadSettingsState(scope) }
  }
}

function renderApp() {
  new Vue({
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