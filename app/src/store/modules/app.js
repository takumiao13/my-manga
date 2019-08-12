import { createTypesWithNs } from '../helpers';

// types for internal
const ns = 'app';
const TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR';

export const types = createTypesWithNs([
  TOGGLE_SIDEBAR
], ns);

const CLASS_NAMES = {
  SIDEBAR_OPEN: 'sidebar-open'
};

export default {
  namespaced: true,

  state: {
    isSidebarOpen: false
  },

  actions: {
    [TOGGLE_SIDEBAR]({ commit }, payload = {}) {
      commit(TOGGLE_SIDEBAR, payload);
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
    }
  }
};