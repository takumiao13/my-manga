import { createTypesWithNamespace } from '../helpers';
import { NAMESPACE as SETTINGS_NAMESPACE } from './settings'
import { isUndef } from '@/helpers/utils';

// Namespace
export const NAMESPACE = 'app';

// Types Enum
const TOGGLE_ASIDE    = 'TOGGLE_ASIDE';
const TOGGLE_SIDEBAR  = 'TOGGLE_SIDEBAR';
const TOGGLE_REPO     = 'TOGGLE_REPO';
const TOGGLE_ACTIVITY = 'TOGGLE_ACTIVITY';
const ERROR           = 'ERROR';
const PWA_INSTALL_PROMPT = 'PWA_INSTALL_PROMPT';

const ClassNames = {
  ASIDE_OPEN: 'aside-open',
  SIDEBAR_COLLAPSED: 'sidebar-collapsed'
};

export const types = createTypesWithNamespace([
  TOGGLE_ASIDE, TOGGLE_SIDEBAR, TOGGLE_REPO, TOGGLE_ACTIVITY, 
  ERROR, PWA_INSTALL_PROMPT
], NAMESPACE);

export default {
  namespaced: true,

  state: {
    asideOpen: false, // TODO: use a more suitable name replace it
    sidebarOpen: true,
    repoId: '',
    activity: '', // activity tab
    error: null,
    pwaInstallPrompt: null
  },

  getters: {
    repo(state, getters, allState, allGetters) {
      return state.repoId ? 
        allGetters[`${SETTINGS_NAMESPACE}/${state.repoId}/repo`] : 
        {};
    }
  },

  mutations: {
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

    [ERROR](state, payload) {
      state.error = payload;
    },

    [PWA_INSTALL_PROMPT](state, payload) {
      state.pwaInstallPrompt = payload.pwaInstallPrompt;
    }
  }
};