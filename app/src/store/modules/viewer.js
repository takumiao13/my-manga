import Vue from 'vue';
import { assign } from '@/helpers';
import { createTypesWithNs, createRequestStatus } from '../helpers';
import mangaAPI from '@/apis/manga';

// types for internal
const ns = 'viewer';
const LOAD = 'LOAD';
const GO = 'GO';
const GO_CH = 'GO_CH';
const VIEW = 'VIEW';
const ZOOM = 'ZOOM';

const statusHelper = createRequestStatus('status');

export const types = createTypesWithNs([ LOAD, GO, GO_CH, VIEW, ZOOM ], ns);

export default {
  namespaced: true,

  state: {
    mode: 'scroll',
    zoom: 'width',
    path: '',
    images: [],
    chapters: [],
    page: 1,
    ch: '',
    chIndex: 0,
    config: {},
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
    }
  },

  actions: {
    [LOAD]({ commit }, payload = {}) {
      commit(LOAD, payload);
    },

    [VIEW]({ commit, state }, payload = {}) {
      const { dirId, path, ch } = payload;
      const promiseArray = [];
      const pathResStub = () => {};
      const chResStub = () => {};

      const pathPromise = state.path !== path ? 
        mangaAPI.list({ dirId, path }) : pathResStub;
  
      promiseArray.push(pathPromise);
      
      if (ch) {
        const chPromise = state.ch !== ch ? 
          mangaAPI.list({ dirId, path: `${path}/${ch}` }) : chResStub;

        promiseArray.push(chPromise);
      }
  
      statusHelper.pending(commit);
      Promise.all(promiseArray).then(([res1, res2]) => {
        let path, chapters, images;
  
        // handle no chapters
        if (res2 === void 0) {
          if (res1 !== pathResStub) {
            path = res1.name;
            images = res1.images;
            chapters = res1.chapters;
          }
          
        // handle chapters
        } else {
          if (res1 !== pathResStub) {
            path = res1.name;
            chapters = res1.chapters;
          }
  
          if (res2 !== chResStub) {
            images = res2.images;
          }
        }
  
        commit(LOAD, { path, images, chapters });
        commit(GO, { ch });
        Vue.nextTick(() => statusHelper.success(commit));
      }).catch(error => {
        statusHelper.error(commit, { error });
      });
    },

    [GO_CH]({ commit, state }, payload = {}) {
      const { dirId, chIndex } = payload;
      const chapter = state.chapters[chIndex-1];
      const ch = chapter.name;

      if (chIndex < 1 || chIndex > state.chCount) return;
      
      // load new chapter images
      mangaAPI.list({ dirId, path: `${state.path}/${ch}` })
        .then(res => {
          const { images } = res;

          commit(LOAD, { images });
          commit(GO, { page: 1, ch });
          window.history.replaceState(null, null, ch); // change history
        });
    },

    [GO]({ commit, state, getters }, payload = {}) {
      const { page } = payload;
      if (page < 1 || page > getters.count) return;
      // should empty ch
      commit(GO, payload);
    },

    [ZOOM]({ commit }, payload = {}) {
      commit(ZOOM, payload);
    }
  },

  mutations: {
    [LOAD](state, payload) {      
      assign(state, payload);
    },

    [GO](state, payload) {
      assign(state, payload);
    },

    [ZOOM](state, payload) {
      state.zoom = payload.zoom;
    },

    ...statusHelper.mutation()
  }
};