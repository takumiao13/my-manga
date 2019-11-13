import { createTypesWithNamespace } from '../helpers';
import { NAMESPACE as SETTINGS_NAMESPACE } from './settings'
import { isUndef } from '@/helpers';

// Namespace
export const NAMESPACE = 'app';

// Types Enum
const TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR';
const TOGGLE_REPO    = 'TOGGLE_REPO';
const ERROR          = 'ERROR';

const ClassNames = {
  SIDEBAR_OPEN: 'sidebar-open'
};

export const types = createTypesWithNamespace([
  TOGGLE_SIDEBAR, TOGGLE_REPO, ERROR
], NAMESPACE);

export default {
  namespaced: true,

  state: {
    sidebarOpen: false,
    repoId: '',
    error: null,
  },

  getters: {
    repo(state, getters, allState, allGetters) {
      return state.repoId ? 
        allGetters[`${SETTINGS_NAMESPACE}/${state.repoId}/repo`] : 
        {};
    }
  },

  actions: {
    [TOGGLE_SIDEBAR]({ commit }, payload = {}) {
      commit(TOGGLE_SIDEBAR, payload);
    },

    [TOGGLE_REPO]({ commit }, payload = {}) {
      commit(TOGGLE_REPO, payload);
    },

    [ERROR]({ commit }, payload) {
      commit(ERROR, payload);
    }
  },

  mutations: {
    [TOGGLE_SIDEBAR](state, payload) {
      const body = window.document.body;
      const { open } = payload;

      if (isUndef(open)) {
        body.classList.toggle(ClassNames.SIDEBAR_OPEN);
        state.sidebarOpen = !state.sidebarOpen;
        
      } else {
        body.classList[open ? 'add' : 'remove'](ClassNames.SIDEBAR_OPEN);
        state.sidebarOpen = !!open;
      }
    },

    [TOGGLE_REPO](state, payload) {
      state.repoId = payload.repo;
    },

    [ERROR](state, payload) {
      state.error = payload;
    }
  }
};