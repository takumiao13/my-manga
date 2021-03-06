import Vue from 'vue';
import * as minimatch from 'minimatch';
import { safeAssign, isDef, find } from '@/helpers/utils';
import mangaAPI from '@/apis/manga';
import consts from '@/consts';
import { createRequestStatus } from '../helpers';
import { NAMESPACE as APP_NAMESPACE } from './app'

// Namespace
export const NAMESPACE = 'viewer';

// Types Enum
const SET_MANGA = 'setManga';
const SET_PAGE = 'setPage';
const SET_SETTINGS = 'setSettings';
const SET_LOCKING = 'setLocking';
const SET_FULLSCREEN = 'setFullscreen';
const SET_AUTO_PLAYING = 'setAutoPlaying';

const statusHelper = createRequestStatus('status');

const initialState = {
  name: '', // manga name
  path: '', // manga path
  cover: '', // cover path
  verNames: [],
  images: [],
  chapters: [],

  source: '', //video only
  parts: [], // video only

  ch: '', // original chapter name
  chIndex: 0,
  chName: '', // chapter name

  // common state
  page: 1, // curr page
  
  activeVer: '',
  fullscreen: false,
  locking: true,

  // mode state
  autoPlaying: false, // use `autoPlaying` replace later

  // settings state
  settings: {
    zoom: 'width',
    pagerInfo: true,
    hand: 'right',
    // scroll only
    gaps: true,
    scrollSpeed: 100,
    // swipe only
    effect: 'slide',
    playInterval: 2000
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

    success(state) {
      return statusHelper.is.success(state);
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
      const { path } = state;
      const repoState = allGetters[`${APP_NAMESPACE}/repo`]; // find nested state
      const viewerSettings = repoState.viewer || {};
      const mergedSettings = { ...viewerSettings.options || {}, ...state.settings };

      // not change override settings.json default mode
      if (!mergedSettings.mode) {
        mergedSettings.mode = consts.VIEWER_MODE.SCROLL;
      }

      // override default settings
      if (viewerSettings.overrides) {
        viewerSettings.overrides.forEach(item => {
          if (minimatch(path, item.path)) {
            Object.assign(mergedSettings, item.options || {});
            mergedSettings.force = true; // cannot changed mode
          }
        });
      }

      // the final viewer settings
      return mergedSettings;
    }
  },

  actions: {
    fetchManga({ commit }, payload = {}) {
      let { ch, page } = payload;
      let name, path, images, chapters, verNames, cover;

      const params = {
        dirId: payload.dirId,
        path: payload.path
      };

      // loading
      statusHelper.pending(commit);

      return mangaAPI.list(params)
        .then(res => {
          name = res.name;
          path = res.path;
          images = res.images;
          chapters = res.chapters;
          verNames = res.verNames;
          cover = res.cover;

          const chapterSize = res.chapterSize;

          // auto ch
          if (ch || chapterSize) {
            ch = ch || chapters[0].name;
            return mangaAPI.list({ 
              dirId: payload.dirId, 
              path: `${path}/${ch}` 
            });
          }
        })
        .then(res => {
          if (res) images = res.images;
          
          // try to remove name prefix
          const chName = ch.replace(`${name} - `, '');
          commit(SET_MANGA, { name, path, cover, images, chapters, chName, verNames });
          commit(SET_PAGE, { page, ch });
          Vue.nextTick(() => statusHelper.success(commit));
        })
        .catch(error => {
          statusHelper.error(commit, { error });
        });
    },

    fetchVideo({ commit }, payload = {}) {
      const { dirId, path, ver } = payload;

      statusHelper.pending(commit);
      return mangaAPI.list({ dirId, path }).then(res => {
        const { path, cover, children, verNames } = res;
        // find video from list
        // - version
        // - name (parts of video)
        const parts = children.filter(item => item.fileType === 'video');
        const findOptions = { name: payload.name || parts[0].name };
        const video = find(children, findOptions);

        commit(SET_MANGA, {
          path,
          name: video.name, 
          source: video.path,
          cover: cover || '', // overwrite cover
          activeVer: ver,
          verNames,
          parts
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
      state.settings = { ...state.settings, ...payload };
    },

    [SET_AUTO_PLAYING](state, payload) {
      const autoPlaying = isDef(payload) ? 
        !!payload :
        !state.autoPlaying;

      state.autoPlaying = autoPlaying;
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