import { safeAssign, last } from '@/helpers/utils';
import { createTypesWithNamespace, createRequestStatus } from '../helpers';
import mangaAPI from '@/apis/manga';

// Namespace
export const NAMESPACE = 'manga';

// Types Enum
const LIST  = 'LIST';
const SHARE = 'SHARE';

const statusHelper = createRequestStatus('status');

export const types = createTypesWithNamespace([ LIST, SHARE ], NAMESPACE);

export const cacheStack = {
  _value: [],

  push(item) {
    this._value.push(item);
  },

  pop(index) {
    const next = this._value.splice(index+1)[0];
    return Object.assign(last(this._value), {
      activePath: next ? next._prevPath : ''
    });
  },

  clear() {
    this._value.length = 0;
  },

  find(dirId, path) {
    const index = this._value.map(item => item.path).lastIndexOf(path);
    return ~index && this._value[index]._dirId === dirId ? index : -1;
  }
};

export default {
  namespaced: true,

  state: {
    inited: false,
    cover: '',
    type: '',
    path: '',
    metadata: null,
    list: [],
    folders: [],
    mangas: [],
    chapters: [],
    images: [],
    activePath: '',
    shortId: false,
    ...statusHelper.state()
  },

  getters: {
    pending(state) {
      return statusHelper.is.pending(state);
    },

    isSuccess: (state) => (immediately) => {
      return statusHelper.is.success(state, immediately);
    },

    success(state) {
      return statusHelper.is.success(state, true);
    },

    empty(state) {
      return state.inited && !state.list.length;
    }
  },

  actions: {
    [LIST]({ commit }, payload = {}) { 
      let index = -1;
      const { path, isBack, dirId } = payload;
      if (isBack) index = cacheStack.find(dirId, path);

      // hack no flashing when random manga
      statusHelper.pending(commit);
      
      // if cannot find cache
      if (index === -1) {
        return mangaAPI.list({ dirId, path })
          .then(res => {
            cacheStack.push(Object.assign(res, { 
              _prevPath: path,
              _dirId: dirId
            }));
   
            commit(LIST, res);
            return statusHelper.success(commit);
          })
          .catch(error => {
            statusHelper.error(commit, error);
          });

      // get result from cache
      } else {
        const result = cacheStack.pop(index);
        commit(LIST, result);
        return statusHelper.success(commit);
      }
    },

    [SHARE]({ commit }, payload = {}) {
      const { url } = payload;
      return mangaAPI.share(url).then(res => {
        commit(SHARE, res);
      })
    }
  },
  
  mutations: {
    [LIST](state, payload) {
      state.inited || (state.inited = true);
      safeAssign(state, { 
        ...payload, 
        error: null,
        shortId: false
      });
    },

    [SHARE](state, payload) {
      const { shortId } = payload;
      safeAssign(state, { shortId });
    },

    ...statusHelper.mutation()
  }
};