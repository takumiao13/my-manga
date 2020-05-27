import { createTypesWithNamespace } from '../helpers';
import { NAMESPACE as SETTINGS_NAMESPACE } from './settings'
import { isUndef } from '@/helpers/utils';
import authAPI from '@/apis/auth';

// Namespace
export const NAMESPACE = 'app';

// Types Enum
const TOGGLE_ASIDE    = 'TOGGLE_ASIDE';
const TOGGLE_SIDEBAR  = 'TOGGLE_SIDEBAR';
const TOGGLE_REPO     = 'TOGGLE_REPO';
const TOGGLE_ACTIVITY = 'TOGGLE_ACTIVITY';
const TOGGLE_SIZE     = 'TOGGLE_SIZE';
const ERROR           = 'ERROR';
const PWA_INSTALL_PROMPT = 'PWA_INSTALL_PROMPT';
const USER           = 'setUser';
const CHECK_USER     = 'checkUser';
const SET_ERROR      = 'setError';

const ClassNames = {
  ASIDE_OPEN: 'aside-open',
  SIDEBAR_COLLAPSED: 'sidebar-collapsed'
};

const TOKEN_KEY = 'Authorization';

const DEFAULT_ERROR = {
  name: 'THAT\'S AN ERROR',
  icon: 'exclamation-triangle',
  message: 'An error has occurred and we\'re working to fix the problem.'
};

export const types = createTypesWithNamespace([
  TOGGLE_ASIDE, TOGGLE_SIDEBAR, TOGGLE_REPO, TOGGLE_ACTIVITY, TOGGLE_SIZE,
  ERROR, PWA_INSTALL_PROMPT, USER, CHECK_USER, SET_ERROR
], NAMESPACE);

export default {
  namespaced: true,

  state: {
    asideOpen: false, // TODO: use a more suitable name replace it
    sidebarOpen: true,
    repoId: '',
    size: '',
    activity: '', // activity tab
    error: null,
    pwaInstallPrompt: null,
    user: {
      token: window.localStorage.getItem(TOKEN_KEY)
    }
  },

  getters: {
    repo(state, getters, allState, allGetters) {
      return state.repoId ? 
        allGetters[`${SETTINGS_NAMESPACE}/${state.repoId}/repo`] : 
        {};
    }
  },

  actions: {
    [USER]({ commit }, payload = {}) {
      return authAPI.login(payload)
        .then((res) => {
          commit(USER, { ...res });
        });
    },

    [CHECK_USER]({ commit }) {
      return authAPI.check().then(res => {
        commit(USER, res);
      });
    }
  },

  mutations: {
    [USER](state, payload) {
      Object.assign(state.user, payload);
      
      // when check api not with token
      const { token } = payload;
      if (token) localStorage.setItem(TOKEN_KEY, token);
    },

    // only in small device
    [TOGGLE_ASIDE](state, payload = {}) {
      const body = window.document.body;
      const { open } = payload;

      if (isUndef(open)) {
        body.classList.toggle(ClassNames.ASIDE_OPEN);
        state.asideOpen = !state.asideOpen;
        
      } else {
        body.classList[open ? 'add' : 'remove'](ClassNames.ASIDE_OPEN);
        state.asideOpen = !!open;
      }
    },

    [TOGGLE_SIDEBAR](state, payload = {}) {
      const body = window.document.body;
      const { open } = payload;

      if (isUndef(open)) {
        body.classList.toggle(ClassNames.SIDEBAR_COLLAPSED);
        state.sidebarOpen = !state.sidebarOpen;
        
      } else {
        body.classList[open ? 'remove' : 'add'](ClassNames.SIDEBAR_COLLAPSED);
        state.sidebarOpen = !!open;
      }
    },

    [TOGGLE_REPO](state, payload = {}) {
      state.repoId = payload.repo;
    },

    [TOGGLE_ACTIVITY](state, payload = {}) {
      state.activity = payload.activity || 'explorer'; // default
    },

    [TOGGLE_SIZE](state, payload = {}) {
      state.size = payload.size || 'lg';
    },

    [SET_ERROR](state, payload) {
      console.log('error', payload);
      state.error = payload === null ? 
        null : 
        Object.assign({}, DEFAULT_ERROR, payload || {});
    },

    [PWA_INSTALL_PROMPT](state, payload) {
      state.pwaInstallPrompt = payload.pwaInstallPrompt;
    }
  }
};