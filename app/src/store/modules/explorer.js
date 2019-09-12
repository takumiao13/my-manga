import mangaAPI from '@/apis/manga';
import { createTypesWithNs, createRequestStatus } from '../helpers';

// types for internal
const ns = 'explorer';
const FETCH = 'FETCH';

const statusHelper = createRequestStatus('status');

const initialState = {
  inited: false,
  folders: [],
  ...statusHelper.state()
}

export const types = createTypesWithNs([ FETCH ], ns);

export default {
  namespaced: true,

  state: initialState,

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
        .then(res => {
          // group manga
          const mangaGroup = {
            _mangaGroup: true,
            children: []
          };
          const folders = [];
          res.children.forEach(child => {
            if (child.type === 'FOLDER') {
              folders.push(child);
            } else {
              mangaGroup.children.push(child);
            }
          });

          const count = mangaGroup.children.length;
          if (count) {
            folders.unshift(mangaGroup);
          }
          commit(FETCH, { path, folders })
          if (global) {
            return statusHelper.success(commit)
          }
        })
        .catch(error => global && statusHelper.error(commit, { error }));
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
    if (node.path === path) {
      return node;
    } else if (node.children.length) {
      const state = findStateByPath(node.children, path);
      if (state) return state;
    }
  }

  return null;
}