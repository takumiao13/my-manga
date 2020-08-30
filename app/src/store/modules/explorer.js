import mangaAPI from '@/apis/manga';
import { find } from '@/helpers/utils';
import { createRequestStatus } from '../helpers';

// Namespace
export const NAMESPACE = 'explorer';

// Types Enum
const FETCH_FOLDERS = 'fetchFolders';
const FETCH_LATEST = 'fetchLatest';
const FETCH_VERSION = 'fetchVersions';

const SET_FOLDERS = 'setFolders';
const SET_LATEST = 'setLatest';
const SET_VERSIONS = 'setVersions';

const statusHelper = createRequestStatus('status');

const initialState = {
  folders: null,
  latest: [],
  versions: [],
  ...statusHelper.state()
};

const createModule = (state = { ...initialState }) => ({
  namespaced: true,

  state,

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
    [FETCH_FOLDERS]({ commit }, payload = {}) {
      const { path, dirId } = payload;
      const global = !path;
      if (global) statusHelper.pending(commit);

      return mangaAPI.folder({ path, dirId })
        .then(({ list }) => {
          commit(SET_FOLDERS, { path, list });

          if (global) {
            return statusHelper.success(commit)
          }
        })
        .catch(error => {
          global && statusHelper.error(commit, { error })
          throw error
        });
    },

    [FETCH_LATEST]({ commit }, payload = {}) {
      const { dirId } = payload;
      return mangaAPI.latest({ dirId })
        .then((latest) => {
          commit(SET_LATEST, latest);
        })
    },

    [FETCH_VERSION]({ commit }, payload = {}) {
      const { dirId } = payload;
      return mangaAPI.versions({ dirId })
        .then(versions => {
          commit(SET_VERSIONS, versions);
        })
    }
  },

  mutations: {
    [SET_FOLDERS](state, payload) {
      const { path, list } = payload;
      let folders;

      // handle folders only contains `_mangaGroup`
      if (list && list.length == 1 && list[0]._mangaGroup) {
        const parent = find(state.folders, { path });
        folders = list[0].children;

        // care for root has not parent
        if (parent) {
          parent._mangaGroup = true;
        }
      } else {
        folders = list;
      }

      // TODO: 
      // - optimize
      // - duplicate when hot-reload
      if (!path) { // as global
        state.folders = folders;
      } else {
        state.folders = [...state.folders, ...folders ];
      }
    },

    [SET_LATEST](state, payload) {
      state.latest = payload;
    },

    [SET_VERSIONS](state, payload) {
      state.versions = payload;
    },

    ...statusHelper.mutation()
  }
});

export default createModule;

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