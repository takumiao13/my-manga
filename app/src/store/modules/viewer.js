import Vue from 'vue';
import { assign, isDef } from '@/helpers';
import { createTypesWithNs, createRequestStatus } from '../helpers';
import mangaAPI from '@/apis/manga';

// types for internal
const ns = 'viewer';
const LOAD = 'LOAD';
const GO = 'GO';
const VIEW = 'VIEW';
const ZOOM = 'ZOOM';
const TOGGLE_GAPS = 'TOGGLE_GAPS';
const TOGGLE_AUTO_SCROLLING = 'TOGGLE_AUTO_SCROLLING';
const TOGGLE_HAND_MODE = 'TOGGLE_HAND_MODE';

const statusHelper = createRequestStatus('status');

export const types = createTypesWithNs([ 
  LOAD, GO, VIEW, ZOOM, TOGGLE_GAPS, TOGGLE_AUTO_SCROLLING, TOGGLE_HAND_MODE
], ns);

export default {
  namespaced: true,

  state: {
    mode: 'scroll',
    zoom: 'width',
    gaps: true,
    autoScrolling: false,
    handMode: 'right',
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
      const { dirId, path, ch, page } = payload;
      const promiseArray = [];
      const pathResStub = () => {};
      const chResStub = () => {};

      const pathPromise = state.path !== path ? 
        mangaAPI.list({ dirId, path }) : pathResStub;
  
      promiseArray.push(pathPromise);
      
      if (ch) {
        const chPromise = state.ch !== ch ? 
          mangaAPI.list({ dirId, path: `${path}/${ch}` }) : chResStub;

        //const chPromise = mangaAPI.list({ dirId, path: `${path}/${ch}` })
        promiseArray.push(chPromise);
      }
  
      statusHelper.pending(commit);
      Promise.all(promiseArray).then(([res1, res2]) => {
        let path, chapters, images;
  
        // handle no chapters
        if (res2 === void 0) {
          if (res1 !== pathResStub) {
            path = res1.path;
            images = res1.images;
            chapters = res1.chapters;
          }
          
        // handle chapters
        } else {
          if (res1 !== pathResStub) {
            path = res1.path;
            chapters = res1.chapters;
          }
  
          if (res2 !== chResStub) {
            images = res2.images;
          }
        }

        console.log(path, images, chapters);
        console.log(page, ch);
  
        commit(LOAD, { path, images, chapters });
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
    },

    [ZOOM]({ commit }, payload = {}) {
      commit(ZOOM, payload);
    },

    [TOGGLE_GAPS]({ commit }, payload = {}) {
      commit(TOGGLE_GAPS, payload);
    },

    [TOGGLE_AUTO_SCROLLING]({ commit }, payload = {}) {
      commit(TOGGLE_AUTO_SCROLLING, payload);
    },

    [TOGGLE_HAND_MODE]({ commit }, payload = {}) {
      commit(TOGGLE_HAND_MODE, payload);
    },
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

    [TOGGLE_GAPS](state) {
      state.gaps = !state.gaps;
    },

    [TOGGLE_AUTO_SCROLLING](state, payload) {
      const { autoScrolling } = payload;
      state.autoScrolling = isDef(autoScrolling) ? 
       !!autoScrolling :
       !state.autoScrolling;
    },

    [TOGGLE_HAND_MODE](state) {
      if (state.handMode === 'right') {
        state.handMode = 'left';
      } else if (state.handMode === 'left') {
        state.handMode = 'right';
      }
    },

    ...statusHelper.mutation()
  }
};