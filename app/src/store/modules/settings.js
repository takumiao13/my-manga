import Vue from 'vue';
import { safeAssign, get, unset, isIndex, isArray, isUndef, stringToPath } from '@/helpers/utils';
import { createTypesWithNamespace } from '../helpers';
import settingsAPI from '@/apis/settings';

// Namespace
export const NAMESPACE = 'settings';

// sub module
const user = 'user';
const repo = 'repo';

// Types Enum
const INIT  = 'INIT';
const SET   = 'SET';
const UNSET = 'UNSET';

export const createTypes = (scope) => 
  createTypesWithNamespace([ INIT, SET, UNSET ], `${NAMESPACE}/${scope}`);

export const createSettings = (scope) => ({
  namespaced: true,

  state: {
    data: null
  },

  getters: {
    settings(state) {
      return state.data;
    },

    repo(state, getters) {
      const settings = getters.settings;

      return (scope !== 'user' && settings) ? {
         name: settings.name.toUpperCase(),
         dirId: settings.dirId
      } : {}
    },

    repos(state) {
      const repos = get(state, 'data.repos');

      if (!repos) return null;

      const parseRepo = (repo) => 
        Object.assign(repo, { name: repo.name.toUpperCase() || 'ROOT' });

      return repos.map(parseRepo);
    }
  },

  actions: {
    [INIT]({ commit }) {
      return settingsAPI.get({ scope })
        .then(res => commit(INIT, res.data));
    },

    [SET]({ commit }, payload = {}) {
      const { key } = payload;
      const body = safeAssign({ scope }, payload);
      
      return settingsAPI.post(body)
        .then(res => commit(SET, { key, value: res.data }));
    },

    [UNSET]({ commit }, payload = {}) {
      const { key } = payload;
      const body = safeAssign({ scope }, payload);
      
      return settingsAPI.post(body)
        .then(() => commit(UNSET, { key }));
    }
  },

  mutations: {
    [INIT](state, payload) {
      if (payload) {
        // when change repo settings we should reset data
        Vue.set(state, 'data', {});
        Object.keys(payload).forEach(key => {
          Vue.set(state.data, key, payload[key]);
        });
      }
    },

    [SET](state, payload) {
      const settings = state.data;
      const { key, value } = payload;
      const path = stringToPath(key);

      if (path.length == 1) {
        Vue.set(settings, key, value);

      // handle cast path
      } else { // [repos, 1]
        const ka = path.slice(0, -1); // ['repos'] 
        const kb = path.slice(-1)[0]; // 1
        let data = get(settings, ka);
        
        if (isUndef(data)) {
          let obj, kd;
          if (ka.length == 1) {
            kd = ka;
            obj = settings; // Vue.set(settings, 'repos', [])
          } else {
            const kc = ka.slice(0, -1);
            kd = ka.slice(-1)[0];    // obj = get(settings, 'a.b.c');
            obj = get(settings, kc); // Vue.set(obj, 'repos', []);
          }
          
          Vue.set(obj, kd, isIndex(kb) ? [] : {});
          data = get(settings, ka);
        }
        
        if (isArray(data) && isIndex(kb) && kb >= data.length) {
          data[kb] = undefined;  
        }

        Vue.set(data, kb, value);
      }
    },

    [UNSET](state, payload) {
      const settings = state.data;
      const { key } = payload;
      unset(settings, key);
    }
  }
});

export const types = {
  [user]: createTypes(user),
  [repo]: createTypes(repo)
};

export default {
  namespaced: true,

  modules: {
    [user]: createSettings(user),
    [repo]: createSettings(repo)
  }
};