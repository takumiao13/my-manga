import { assign } from '@/helpers';
import { createTypesWithNs, createRequestStatus } from '../helpers';
import mangaAPI from '@/apis/manga';

// types for internal
const ns = 'manga';
const LIST = 'LIST';

const statusHelper = createRequestStatus('status');

const initialState = {
  inited: false,
  path: '',
  metadata: null,
  list: [],
  folders: [],
  mangas: [],
  chapters: [],
  images: [], 
  ...statusHelper.state()
};

export const types = createTypesWithNs([ LIST ], ns);

export default {
  namespaced: true,

  state: initialState,

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
      statusHelper.pending(commit);
      return mangaAPI.list({ path: payload.path })
        .then(res => {
          commit(LIST, res);
          return statusHelper.success(commit);
        })
        .catch(error => {
          statusHelper.error(commit, { error });
        });
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