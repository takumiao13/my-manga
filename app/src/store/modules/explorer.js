import mangaAPI from '@/apis/manga';
import { find } from '@/helpers/utils';
import { createTypesWithNamespace, createRequestStatus } from '../helpers';

// Namespace
export const NAMESPACE = 'explorer';

// Types Enum
const FETCH = 'FETCH';
const LATEST = 'LATEST';

const statusHelper = createRequestStatus('status');

export const types = createTypesWithNamespace([ FETCH, LATEST ], NAMESPACE);

export default {
  namespaced: true,

  state: {
    folders: null,
    latest: [],
    ...statusHelper.state()
  },

  getters: {
    folderTree(state) {
      return state.folders ? treeify(state.folders) : null;
    },

    pending(state) {
      return statusHelper.is.pending(state);
    },

    success(state) {
      return statusHelper.is.success(state);
    },

    empty(state) {
      return state.folders && !state.folders.length;
    }
  },

  actions: {
    [FETCH]({ commit }, payload = {}) {
      const { path, dirId } = payload;
      const global = !path;
      if (global) statusHelper.pending(commit);

      return mangaAPI.folder({ path, dirId })
        .then(({ list }) => {
          commit(FETCH, { path, list });

          if (global) {
            return statusHelper.success(commit)
          }
        })
        .catch(error => {
          global && statusHelper.error(commit, { error })
          throw error
        });
    },

    [LATEST]({ commit }, payload = {}) {
      const { dirId } = payload;
      return mangaAPI.latest({ dirId })
        .then((latest) => {
          commit(LATEST, { latest });
        })
    }
  },

  mutations: {
    [FETCH](state, payload) {
      const { path, list } = payload;
      
      if (!state.folders) {
        state.folders = list;
      } else {
        let folders;
        if (list && list.length == 1 && list[0]._mangaGroup) {
          const parent = find(state.folders, { path });
          folders = list[0].children;
          parent._mangaGroup = true;
        } else {
          folders = list;
        }
        state.folders = [...state.folders, ...folders ];
      }
    },

    [LATEST](state, payload) {
      const { latest } = payload;
      state.latest = latest;
    },

    ...statusHelper.mutation()
  }
};

function treeify(list) {
  const tree = [], seed = {};

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const path = item.path;
    if (path) {
      seed[path] = item;
      item.children = [];
    }
  }

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (seed[item._parentPath]) {
      seed[item._parentPath].children.push(item)
    } else {
      tree.push(item);
    }
  }

  return tree;
}