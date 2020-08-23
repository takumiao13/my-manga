import { createTypesWithNamespace } from '../helpers';
import { NAMESPACE as SETTINGS_NAMESPACE } from './settings'
import { isUndef } from '@/helpers/utils';
import authAPI from '@/apis/auth';

// Namespace
export const NAMESPACE = 'app';

// Types Enum
const LOGIN = 'login';
const CHECK_USER = 'checkUser';

const TOGGLE_ASIDE   = 'toggleAside';
const TOGGLE_SIDEBAR = 'toggleSidebar';
const SET_REPO_ID    = 'setRepoId';
const SET_USER       = 'setUser';
const SET_ACTIVITY   = 'setActivity';
const SET_SIZE       = 'setSize';
const SET_ERROR      = 'setError';
const SET_PWA_INSTALL_PROMPT = 'setPwaInstallPrompt';

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
  CHECK_USER, LOGIN,
  TOGGLE_ASIDE, TOGGLE_SIDEBAR, SET_REPO_ID, SET_ACTIVITY, SET_SIZE,
  SET_PWA_INSTALL_PROMPT, SET_USER, SET_ERROR
], NAMESPACE);

export default {
  namespaced: true,

  state: {
    asideOpen: false,
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
    [LOGIN]({ commit }, payload = {}) {
      return authAPI.login(payload)
        .then((res) => {
          commit(SET_USER, { ...res });
        });
    },

    [CHECK_USER]({ commit }) {
      return authAPI.check().then(res => {
        commit(SET_USER, res);
      });
    }
  },

  mutations: {
    [SET_USER](state, payload) {
      Object.assign(state.user, payload);
      
      // when check api not with token
      const { token } = payload;
      if (token) localStorage.setItem(TOKEN_KEY, token);
    },

    /**
     * toggle aside only in small device
     * @param {*} state 
     * @param {boolean} payload 
     */
    [TOGGLE_ASIDE](state, payload) {
      const body = window.document.body;
      if (isUndef(payload)) {
        body.classList.toggle(ClassNames.ASIDE_OPEN);
        state.asideOpen = !state.asideOpen;
        
      } else {
        body.classList[payload ? 'add' : 'remove'](ClassNames.ASIDE_OPEN);
        state.asideOpen = !!payload;
      }
    },

    /**
     * toggle sidebar
     * @param {*} state 
     * @param {boolean} payload 
     */
    [TOGGLE_SIDEBAR](state, payload) {
      const body = window.document.body;

      if (isUndef(payload)) {
        body.classList.toggle(ClassNames.SIDEBAR_COLLAPSED);
        state.sidebarOpen = !state.sidebarOpen;
        
      } else {
        body.classList[payload ? 'remove' : 'add'](ClassNames.SIDEBAR_COLLAPSED);
        state.sidebarOpen = !!payload;
      }
    },

    /**
     * 
     * @param {*} state 
     * @param {string} payload 
     */
    [SET_REPO_ID](state, payload) {
      state.repoId = payload;
    },

    /**
     * 
     * @param {*} state 
     * @param {string} payload 
     */
    [SET_ACTIVITY](state, payload = 'explorer') {
      state.activity = payload;
    },

    /**
     * 
     * @param {*} state 
     * @param {'sm | md | lg | xl'} payload 
     */
    [SET_SIZE](state, payload = 'lg') {
      state.size = payload;
    },

    [SET_ERROR](state, payload) {
      state.error = payload === null ? 
        null : 
        Object.assign({}, DEFAULT_ERROR, payload || {});
    },

    /**
     * 
     * @param {*} state 
     * @param {*} payload 
     */
    [SET_PWA_INSTALL_PROMPT](state, payload) {
      state.pwaInstallPrompt = payload;
    }
  }
};