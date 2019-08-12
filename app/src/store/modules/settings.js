import { assign, get, unset, isIndex, isArray, last, isDef, isUndef, stringToPath } from '@/helpers';
import { createTypesWithNs } from '../helpers';
import Vue from 'vue';
import settingsAPI from '@/apis/settings';

// types for internal
const ns = 'settings';
const INIT = 'INIT';
const SET = 'SET';

export const types = {
  user: createTypesWithNs([ INIT, SET ], `${ns}/user`),
  repo: createTypesWithNs([ INIT, SET ], `${ns}/repo`)
};

const parseRepoPath = (path) => {
  const seq = /\/|\\/;
  if (path) {
    const fragments = path.split(seq);
    return {
      path,
      name: last(fragments).toUpperCase(),
      dir: fragments.slice(0, -1).join('/')
    }
  } else {
    return {};
  }
}

const createSettings = (scope) => ({
  namespaced: true,

  state: {
    data: null
  },

  getters: {
    settings(state) {
      return state.data;
    },

    repos(state) {
      return (get(state, 'data.repos') || []).map(parseRepoPath);
    },

    baseDir(state) {
      return get(state, 'data.baseDir');
    },

    repoName(state) {
      const settings = state.data || {};
      const { name } = parseRepoPath(settings.baseDir);
      return name || 'My Manga'
    }
  },

  actions: {
    [INIT]({ commit }) {
      return settingsAPI.get({ scope })
        .then(res => commit(INIT, res.data));
    },

    [SET]({ commit }, payload = {}) {
      const body = assign({ scope }, payload);
      return settingsAPI.post(body)
        .then(() => commit(SET, payload));
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
      if (isDef(value)) {
        const path = stringToPath(key);

        if (path.length == 1) {
          Vue.set(settings, key, value);
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
      } else {
        unset(settings, key);
      }
    }
  }
});

export default {
  namespaced: true,

  modules: {
    user: createSettings('user'),
    repo: createSettings('repo')
  }
};