import Vue from 'vue';
import { safeAssign, isDef } from '@/helpers/utils';
import { createTypesWithNamespace, createRequestStatus } from '../helpers';
import { NAMESPACE as APP_NAMESPACE } from './app'
import mangaAPI from '@/apis/manga';

// Namespace
export const NAMESPACE = 'viewer';

// Types Enum
const LOAD  = 'LOAD';
const GO    = 'GO';
const VIEW  = 'VIEW';
const SETTINGS = 'SETTINGS';
const TOGGLE_AUTO_SCROLLING = 'TOGGLE_AUTO_SCROLLING';


const statusHelper = createRequestStatus('status');

export const types = createTypesWithNamespace([ 
  LOAD, GO, VIEW, SETTINGS, TOGGLE_AUTO_SCROLLING
], NAMESPACE);

export default {
  namespaced: true,

  state: {
    mode: 'scroll',  
    autoScrolling: false,
    name: '',
    path: '',
    page: 1,
    ch: '',
    chName: '',
    chIndex: 0,
    images: [],
    chapters: [],
    settings: {
      zoom: 'width',
      gaps: true,
      pagerInfo: true,
      handMode: 'right',
    },
    ...statusHelper.state()
  },

  getters: {
    pending(state) {
      return statusHelper.is.pending(state);
    },
  
    count(state) {
      return state.images.length;
    },

    chIndex(state) {
      return state.chapters.map(ch => ch.name).indexOf(state.ch) + 1;
    },

    chCount(state) {
      return state.chapters.length; 
    },

    settings(state, getters, allState, allGetters) {
      let { gaps } = state.settings;
      const { path } = state;
      const repoState = allGetters[`${APP_NAMESPACE}/repo`];  // find nested state
      const obj = repoState.viewer || {};

      // handle settings gaps
      if (obj.gaps) {
        let rest;
        gaps = obj.gaps['*'] || gaps;

        // match gaps path
        Object.keys(obj.gaps).forEach(p => {
          if (path.indexOf(p) === 0) {
            let r = path.slice(p).length;
            if (!rest || r < rest) {
              rest = r;
              gaps = obj.gaps[p];
            }
          }
        });
      }

      return Object.assign(state.settings, { gaps })
    }
  },

  actions: {
    [LOAD]({ commit }, payload = {}) {
      commit(LOAD, payload);
    },

    [VIEW]({ commit, state }, payload = {}) {
      const { dirId, path, ch, page } = payload;
      const promiseArray = [];
      const pathResStub = () => {};
      const chResStub = () => {};

      const pathPromise = state.path !== path ? 
        mangaAPI.list({ dirId, path }) : 
        pathResStub;
  
      promiseArray.push(pathPromise);
      
      // should fetch chapters
      if (ch) {
        const chPromise = state.ch !== ch ? 
          mangaAPI.list({ dirId, path: `${path}/${ch}` }) : 
          chResStub;

        promiseArray.push(chPromise);
      }
  
      // loading
      statusHelper.pending(commit);
      
      // fetch images and chapter parallelly
      Promise.all(promiseArray).then(([res1, res2]) => {
        let name = state.name, 
            path = state.path, 
            chapters, 
            images;
  
        // handle no chapters
        if (res2 === void 0) {
          if (res1 !== pathResStub) {
            name = res1.name;
            path = res1.path;
            images = res1.images;
            chapters = res1.chapters;
          }
          
        // handle chapters
        } else {
          if (res1 !== pathResStub) {
            name = res1.name;
            path = res1.path;
            chapters = res1.chapters;
          }
  
          if (res2 !== chResStub) {
            images = res2.images;
          }
        }
  
        // try to remove name prefix
        const chName = ch.replace(`${name} - `, '');

        // TODO: replace `safeAssign`
        // sometimes images chapters will be undefined
        // so we should safeAssign it.
        commit(LOAD, { name, path, images, chapters, chName });
        commit(GO, { page, ch });
        Vue.nextTick(() => statusHelper.success(commit));
      }).catch(error => {
        statusHelper.error(commit, { error });
      });
    },

    [GO]({ commit, getters }, payload = {}) {
      const { page, ch } = payload;
      
      if (page < 1) return;
      if (ch && page > getters.chCount) return;
      if (!ch && page > getters.count) return;
      
      // should empty ch
      commit(GO, payload);
    }
  },

  mutations: {
    [LOAD](state, payload) {      
      safeAssign(state, payload);
    },

    [GO](state, payload) {
      safeAssign(state, payload);
    },

    [SETTINGS](state, payload) {
      safeAssign(state.settings, payload);
    },

    [TOGGLE_AUTO_SCROLLING](state, payload) {
      const { autoScrolling } = payload;
      state.autoScrolling = isDef(autoScrolling) ? 
        !!autoScrolling :
        !state.autoScrolling;
    },

    ...statusHelper.mutation()
  }
};