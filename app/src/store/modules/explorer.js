import mangaAPI from '@/apis/manga';
import { createTypesWithNamespace, createRequestStatus } from '../helpers';

// Namespace
export const NAMESPACE = 'explorer';

// Types Enum
const FETCH = 'FETCH';

const statusHelper = createRequestStatus('status');

export const types = createTypesWithNamespace([ FETCH ], NAMESPACE);

export default {
  namespaced: true,

  state: {
    inited: false,
    folders: [],
    ...statusHelper.state()
  },

  getters: {
    pending(state) {
      return statusHelper.is.pending(state);
    },

    success(state) {
      return statusHelper.is.success(state);
    },

    empty(state) {
      return state.inited && !state.folders.length;
    }
  },

  actions: {
    [FETCH]({ commit }, payload = {}) {
      const { path, dirId } = payload;
      const global = !path;
      if (global) statusHelper.pending(commit);

      return mangaAPI.folder({ path, dirId })
        .then(({ folders }) => {
          commit(FETCH, { path, folders });

          if (global) {
            return statusHelper.success(commit)
          }
        })
        .catch(error => {
          console.error(error);
          global && statusHelper.error(commit, { error })
          throw error
        });
    }
  },

  mutations: {
    [FETCH](state, payload) {
      const { path, folders } = payload;
      state.inited || (state.inited = true);

      if (!path) {
        state.folders = folders;
      } else {
        const childState = findStateByPath(state.folders, path);
        if (childState) childState.children = folders;
      }
    },

    ...statusHelper.mutation()
  }
};

function findStateByPath(children, path) {
  let i, l = children.length;
  for (i = 0; i < l; i++) {
    const node = children[i];
    
    // find the target node.
    if (node.path === path) {
      return node; 

    // skip _mangaGroup for performance
    } else if (!node._mangaGroup && node.children && node.children.length) {
      // dfs walk
      const state = findStateByPath(node.children, path);
      if (state) return state;
    }
  }

  return null;
}