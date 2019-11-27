import Vue from 'vue';
import { safeAssign } from '@/helpers/utils';
import { createTypesWithNamespace, createRequestStatus } from '../helpers';
import mangaAPI from '@/apis/manga';

// Namespace
export const NAMESPACE = 'motion';

// Types Enum
const VIEW = 'VIEW';

export const types = createTypesWithNamespace([ 
  VIEW
], NAMESPACE);

const statusHelper = createRequestStatus('status');

export default {
  namespaced: true,

  state: {
    name: '',
    path: '', // the path of motion-manga
    cover: '',
    mime: '',
    ...statusHelper.state()
  },

  getters: {
    pending(state) {
      return statusHelper.is.pending(state);
    },

    success(state) {
      return statusHelper.is.success(state);
    }
  },

  actions: {
    [VIEW]({ commit }, payload = {}) {
      const { dirId, path } = payload;

      statusHelper.pending(commit);
      return mangaAPI.list({ dirId, path }).then(res => {
        const { name, path, cover, mime, isDir, children } = res;
        
        commit(VIEW, {
          name,
          path: isDir ? 
            children.filter(item => item.fileType === 'video')[0].path : path, 
          cover: cover || '',
          mime 
        });

        // should update status after state mutated 
        Vue.nextTick(() => statusHelper.success(commit));
      }).catch(error => {
        statusHelper.error(commit, { error });
      })
    }
  },

  mutations: {
    [VIEW](state, payload) {      
      safeAssign(state, payload);
    },

    ...statusHelper.mutation()
  }
}