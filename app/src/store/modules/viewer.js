import Vue from 'vue';
import { safeAssign, isDef, find } from '@/helpers/utils';
import { createRequestStatus } from '../helpers';
import { NAMESPACE as APP_NAMESPACE } from './app'
import mangaAPI from '@/apis/manga';

// Namespace
export const NAMESPACE = 'viewer';

// Types Enum
const SET_MANGA = 'setManga';
const SET_PAGE = 'setPage';
const SET_SETTINGS = 'setSettings';
const SET_LOCKING = 'setLocking';
const SET_FULLSCREEN = 'setFullscreen';
const SET_SPEED = 'setSpeed';
const SET_AUTO_SCROLLING = 'setAutoScrolling';

const statusHelper = createRequestStatus('status');

const initialState = {
  name: '', // manga name
  path: '', // manga path
  cover: '', // cover path
  verNames: [],
  images: [],
  chapters: [],

  ch: '', // original chapter name
  chIndex: 0,
  chName: '', // chapter name

  // common state
  page: 1, // curr page
  
  activeVer: '',
  fullscreen: false,
  locking: true,

  // mode state
  mode: 'scroll',
  autoScrolling: false, // replace later
  speed: 100,

  // settings state
  settings: {
    zoom: 'width',
    gaps: true,
    pagerInfo: true,
    handMode: 'right',
  },
  ...statusHelper.state()
};

const createModule = (state = { ...initialState }) => ({
  namespaced: true,

  state,

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

      return Object.assign({}, state.settings, { gaps })
    }
  },

  actions: {
    fetchManga({ commit, state }, payload = {}) {
      const { dirId, path, ch, page } = payload;
      const promiseArray = [];
      const pathResStub = () => {};

      const pathPromise = state.path !== path ? 
        mangaAPI.list({ dirId, path }) : 
        pathResStub;
  
      promiseArray.push(pathPromise);

 
      // fetch chapters images every time
      // TODO: should check is not need fetch again
      if (ch) {
        const chPromise = mangaAPI.list({ 
          dirId, 
          path: `${path}/${ch}` 
        }); 
        promiseArray.push(chPromise);
      }
  
      // loading
      statusHelper.pending(commit);
      
      // fetch images and chapter parallelly
      Promise.all(promiseArray).then(([res1, res2]) => {
        let name = state.name, 
            path = state.path, 
            chapters, 
            images,
            verNames,
            cover;
  
        // handle no chapters
        if (res2 === void 0) {
          if (res1 !== pathResStub) {
            name = res1.name;
            path = res1.path;
            images = res1.images;
            chapters = res1.chapters;
            cover = res1.cover;
            verNames = res1.verNames
          }
          
        // handle chapters
        } else {
          if (res1 !== pathResStub) {
            name = res1.name;
            path = res1.path;
            chapters = res1.chapters;
            cover = res1.cover;
            verNames = res1.verNames;
          }
  
          images = res2.images;
        }
  
        // try to remove name prefix
        const chName = ch.replace(`${name} - `, '');
        commit(SET_MANGA, { name, path, cover, images, chapters, chName, verNames });
        commit(SET_PAGE, { page, ch });
        Vue.nextTick(() => statusHelper.success(commit));
      }).catch(error => {
        statusHelper.error(commit, { error });
      });
    },

    fetchVideo({ commit }, payload = {}) {
      const { dirId, path, ver } = payload;

      statusHelper.pending(commit);
      return mangaAPI.list({ dirId, path }).then(res => {
        const { name, cover, children, verNames } = res;
        // find video from list
        // - version
        // - name (parts of video)
        const findOptions = ver ? { ver } : { name: payload.name };
        const video = find(children, findOptions);

        commit(SET_MANGA, {
          name, 
          verNames,
          path: video.path,
          cover: cover || '', // overwrite cover
          activeVer: ver
        });

        // should update status after state mutated 
        Vue.nextTick(() => statusHelper.success(commit));
      }).catch(error => {
        statusHelper.error(commit, { error });
      })
    },

    gotoPage({ commit, getters }, payload) {
      if (typeof payload === 'number') {
        payload = { page: payload };
      }

      const { page, ch } = payload;
      
      if (page < 1 || (!ch && page > getters.count)) return;
  
      // check chapter size ??
      if (ch && page > getters.chCount) return;
      commit(SET_PAGE, payload);
    },

    nextPage({ dispatch, state }) {
      return dispatch('gotoPage', { page: state.page + 1 });
    },

    prevPage({ dispatch }) {
      return dispatch('gotoPage', { page: state.page - 1 });
    },

    autoScroll({ commit }, payload) {
      commit(SET_LOCKING, false);
      commit(SET_AUTO_SCROLLING, payload);
    }
  },

  mutations: {
    // TODO: replace `safeAssign`
    // sometimes images chapters will be undefined
    // so we should safeAssign it.
    [SET_MANGA](state, payload) {      
      safeAssign(state, payload);
    },

    [SET_PAGE](state, { page, ch }) {
      state.page = page;

      // chapters ignore ch
      if (isDef(ch)) {
        state.ch = ch;
      }
    },

    [SET_SETTINGS](state, payload) {
      state.settings = safeAssign(state.settings, payload);
    },

    [SET_AUTO_SCROLLING](state, payload) {
      const autoScrolling = isDef(payload) ? 
        !!payload :
        !state.autoScrolling;

      state.autoScrolling = autoScrolling;
    },

    [SET_SPEED](state, payload) {
      const val = payload;
      if (state.speed === 50 && val < 0) return;
      if (state.speed === 200 && val > 0) return;

      // reset speed
      if (val === 0) {
        state.speed = 100;
      } else {
        state.speed += val;
      }
    },

    [SET_LOCKING](state, payload) {
      const locking = isDef(payload) ?
        !!payload :
        !state.locking;

      state.locking = locking;
    },

    [SET_FULLSCREEN](state, payload) {
      const fullscreen = isDef(payload) ?
        !!payload :
        !state.fullscreen;

      state.fullscreen = fullscreen;
    },

    ...statusHelper.mutation()
  }
});

export default createModule;