import { assign, last } from '@/helpers';
import { createTypesWithNs, createRequestStatus } from '../helpers';
import mangaAPI from '@/apis/manga';

// types for internal
const ns = 'manga';
const LIST = 'LIST';
const statusHelper = createRequestStatus('status');

export const types = createTypesWithNs([ LIST ], ns);

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
    type: '',
    path: '',
    metadata: null,
    list: [],
    folders: [],
    mangas: [],
    chapters: [],
    images: [],
    activePath: '',
    ...statusHelper.state()
  },

  getters: {
    isPending(state) {
      return statusHelper.is.pending(state);
    },

    isSuccess(state) {
      return statusHelper.is.success(state);
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
      console.log(cacheStack);

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
            statusHelper.error(commit, { error });
          });
      // get result from cache
      } else {
        const result = cacheStack.pop(index);
        commit(LIST, result);
        return statusHelper.success(commit);
      }
    }
  },
  
  mutations: {
    [LIST](state, payload) {
      state.inited || (state.inited = true);
      assign(state, payload);
    },

    ...statusHelper.mutation()
  }
};