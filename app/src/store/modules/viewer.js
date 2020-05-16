import Vue from 'vue';
import { safeAssign, isDef, find } from '@/helpers/utils';
import { createTypesWithNamespace, createRequestStatus } from '../helpers';
import { NAMESPACE as APP_NAMESPACE } from './app'
import mangaAPI from '@/apis/manga';

// Namespace
export const NAMESPACE = 'viewer';

// Types Enum
const LOAD  = 'LOAD';
const GO    = 'GO';
const VIEW  = 'VIEW';
const VIEW_VIDEO = 'VIEW_VIDEO';

const SETTINGS = 'setSettings';

const LOCKING = 'setLock';
const FULLSCREEN = 'setFullscreen';

const SPEED = 'setSpeed';
const AUTO_SCROLLING = 'setScroll';


const statusHelper = createRequestStatus('status');

export const types = createTypesWithNamespace([ 
  LOAD, GO, VIEW, VIEW_VIDEO, SETTINGS,
  LOCKING, FULLSCREEN, AUTO_SCROLLING, SPEED
], NAMESPACE);

const initialState = {
  name: '', // manga name
  path: '', // manga path
  page: 1, // curr page
  ch: '', // original chapter name
  chName: '', // chapter name
  chIndex: 0,
  cover: '', // cover path
  verNames: [],
  activeVer: '',
  images: [],
  chapters: [],
  
  // common state
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
    [VIEW]({ commit, state }, payload = {}) {
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
        
        // TODO: replace `safeAssign`
        // sometimes images chapters will be undefined
        // so we should safeAssign it.
        commit(LOAD, { name, path, cover, images, chapters, chName, verNames });
        commit(GO, { page, ch });
        Vue.nextTick(() => statusHelper.success(commit));
      }).catch(error => {
        statusHelper.error(commit, { error });
      });
    },

    [VIEW_VIDEO]({ commit }, payload = {}) {
      const { dirId, path, ver } = payload;

      statusHelper.pending(commit);
      return mangaAPI.list({ dirId, path }).then(res => {
        const { name, cover, children, verNames } = res;
        // find video from list
        // - version
        // - name (parts of video)
        const findOptions = ver ? { ver } : { name: payload.name };
        const video = find(children, findOptions);

        commit(LOAD, {
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

    [GO]({ commit, getters }, payload = {}) {
      const { page, ch } = payload;
      
      if (page < 1) return;
      if (!ch && page > getters.count) return;

      // TODO:
      // check chapter size ??
      if (ch && page > getters.chCount) return;
      
      // should empty ch
      commit(GO, payload);
    },

    [AUTO_SCROLLING]({ commit }, payload) {
      commit(LOCKING, false);
      commit(AUTO_SCROLLING, payload);
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
      state.settings = safeAssign(state.settings, payload);
    },

    [AUTO_SCROLLING](state, payload) {
      const autoScrolling = isDef(payload) ? 
        !!payload :
        !state.autoScrolling;

      state.autoScrolling = autoScrolling;
    },

    [SPEED](state, payload) {
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

    [LOCKING](state, payload) {
      const locking = isDef(payload) ?
        !!payload :
        !state.locking;

      state.locking = locking;
    },

    [FULLSCREEN](state, payload) {
      const fullscreen = isDef(payload) ?
        !!payload :
        !state.fullscreen;

      state.fullscreen = fullscreen;
    },

    ...statusHelper.mutation()
  }
});

export default createModule;