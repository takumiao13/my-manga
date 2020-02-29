import { safeAssign, last, find, pick } from '@/helpers/utils';
import { createTypesWithNamespace, createRequestStatus } from '../helpers';
import mangaAPI from '@/apis/manga';
import consts from '@/consts';

// Namespace
export const NAMESPACE = 'manga';

// Types Enum
const FETCH = 'FETCH';
const SHARE = 'SHARE';
const ADD_VERSION = 'ADD_VERSION';
const TOGGLE_VERSION = 'TOGGLE_VERSION';

const statusHelper = createRequestStatus('status');

export const types = createTypesWithNamespace([ 
  FETCH, SHARE, 
  ADD_VERSION, TOGGLE_VERSION 
], NAMESPACE);

export const cacheStack = {
  _value: [],

  push(item) {
    this._value.push(item);
    console.log('--->', item, this._value);
  },

  pop(index) {
    const next = this._value[index + 1];
    this._value = this._value.slice(0, index + 1);
    return Object.assign(last(this._value), {
      activePath: next ? next._prevPath : ''
    });
  },

  clear() {
    this._value.length = 0;
  },

  find(dirId, path = '', kw) {
    const index = this._value
      .map(item => item.path)
      .lastIndexOf(path);

    console.log('--->', index, dirId, kw);
    if (~index) {
      const target = this._value[index];
      console.log(target);

      if (target._dirId === dirId && target._kw === kw) {
        return index;
      } else {
        return -1
      }
    } else {
      return -1;
    }
  }
};

export default {
  namespaced: true,

  state: {
    inited: false,
    cover: '',
    type: '',
    name: '',
    path: '',
    metadata: null,
    list: [], // <-- all children
    files: [], // Manga[]
    mangas: [], // Manga[]
    chapters: [], // Manga[]
    versions: [], // Manga[]
    verNames: null, // String[]
    images: [], // Manga[]

    activePath: '', // acitve path of `state.list`
    activeVer: '', // active ver of `state.versions`
    shortId: false,

    ...statusHelper.state()
  },

  getters: {
    pending(state) {
      return statusHelper.is.pending(state);
    },

    success(state) {
      return statusHelper.is.success(state);
    },

    empty(state) {
      return state.inited && state.path !== consts.LATEST_PATH && !state.list.length;
    }
  },

  actions: {
    [FETCH]({ commit }, payload = {}) {
      let index = -1;
      const { dirId, path, isBack, search, keyword } = payload;
      if (isBack) index = cacheStack.find(dirId, path, keyword);
      // console.log(isBack, index, path);

      // hack no flashing when random manga
      statusHelper.pending(commit);

      if (path === consts.LATEST_PATH) {
        commit(FETCH, {
          name: 'Latest',
          path,
          metadata: null,
          activePath: '',
          activeVer: '',
          shortId: false,
          list: [],
          files: [], 
          mangas: [],
          chapters: [],
          versions: [],
          images: [],
        });
        return statusHelper.success(commit);
      }
      
      // if cannot find cache
      if (index === -1) {
        const method = search ? 'search' : 'list';
        const params = { dirId, path };
        if (search) {
          params.keyword = keyword;
        }
        return mangaAPI[method](params)
          .then(res => {
            cacheStack.push(Object.assign(res, {
              _prevPath: path,
              _dirId: dirId,
              _kw: keyword
            }));
   
            commit(FETCH, res);
            return statusHelper.success(commit);
          })
          .catch(error => {
            statusHelper.error(commit, error);
          });

      // get result from cache
      } else {
        const result = cacheStack.pop(index);
        console.log(cacheStack)
        commit(FETCH, result);
        return statusHelper.success(commit);
      }
    },

    [TOGGLE_VERSION]({ commit, state }, payload = {}) {
      const { activeVer, versions } = state;
      const { dirId, ver } = payload;
      
      if (activeVer === ver) return;

      const currVer = find(versions, { ver });
      const { inited, path } = currVer;

      // check version has loaded
      if (inited) {
        commit(TOGGLE_VERSION, { ver, res: currVer });
      } else {
        // get version data first
        mangaAPI.list({ dirId, path })
          .then(res => {
            commit(ADD_VERSION, { ver, res });
            commit(TOGGLE_VERSION, { ver, res }) 
          });
      }
    },

    [SHARE]({ commit }, payload = {}) {
      const { url } = payload;
      return mangaAPI.share(url).then(res => {
        commit(SHARE, res);
      })
    }
  },
  
  mutations: {
    [FETCH](state, payload) {
      state.inited || (state.inited = true);
      safeAssign(state, { 
        ...payload,
        activeVer: '',
        error: null,
        shortId: false
      });
    },

    [ADD_VERSION](state, payload) {
      const { ver, res } = payload;
      const version = find(state.versions, { ver });
      safeAssign(version, { ...res, inited: true }); // add version data
    },

    [TOGGLE_VERSION](state, payload) {
      const { ver, res } = payload;
      const obj = pick(res, ['list', 'files', 'mangas', 'chapters', 'images']);

      // use version date replace current data
      state.activeVer = ver;
      safeAssign(state, obj); 
      //console.log(version, state);
    },

    [SHARE](state, payload) {
      const { shortId } = payload;
      safeAssign(state, { shortId });
    },

    ...statusHelper.mutation()
  }
};