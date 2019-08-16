import { createTypesWithNs } from '../helpers';

// types for internal
const ns = 'app';
const TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR';
const TOGGLE_REPO = 'TOGGLE_REPO';

export const types = createTypesWithNs([
  TOGGLE_SIDEBAR, TOGGLE_REPO
], ns);

const CLASS_NAMES = {
  SIDEBAR_OPEN: 'sidebar-open'
};

export default {
  namespaced: true,

  state: {
    isSidebarOpen: false,
    repoId: '',
  },

  getters: {
    repo(state, getters, allState, allGetters) {
      return state.repoId ? allGetters[`settings/${state.repoId}/repo`] : {};
    }
  },

  actions: {
    [TOGGLE_SIDEBAR]({ commit }, payload = {}) {
      commit(TOGGLE_SIDEBAR, payload);
    },

    [TOGGLE_REPO]({ commit }, payload = {}) {
      commit(TOGGLE_REPO, payload);
    }
  },

  mutations: {
    [TOGGLE_SIDEBAR](state, payload) {
      const body = window.document.body;
      const { open } = payload;

      if (open === undefined) {
        body.classList.toggle(CLASS_NAMES.SIDEBAR_OPEN);
        state.isSidebarOpen = !state.isSidebarOpen;
        
      } else {
        body.classList[open ? 'add' : 'remove'](CLASS_NAMES.SIDEBAR_OPEN);
        state.isSidebarOpen = !!open;
      }
    },

    [TOGGLE_REPO](state, payload) {
      state.repoId = payload.repo;
    }
  }
};