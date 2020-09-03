import { safeAssign, last, find, pick } from '@/helpers/utils';
import { createTypesWithNamespace, createRequestStatus } from '../helpers';
import mangaAPI from '@/apis/manga';
import consts from '@/consts';

// Namespace
export const NAMESPACE = 'manga';

// Types Enum
const FETCH_MANGAS = 'fetchMangas';
const FETCH_VERSION = 'fetchVersion';
const SHARE = 'share';

const SET_MANGAS = 'setMangas';
const ADD_VERSION = 'addVersion';
const SET_VERSION = 'setVersion';

const statusHelper = createRequestStatus('status');

export const types = createTypesWithNamespace([ 
  FETCH_MANGAS,
  FETCH_VERSION,
  SHARE
], NAMESPACE);

export const cacheStack = {
  _value: [],

  push(item) {
    this._value.push(item);
  },

  replace(item) {
    const index = this.find(item._dirId, item.path, item._kw);

    if (index === - 1) {
      this.push(item);
      return
    }

    this._value[index] = item;
  },

  pop(index) {
    // get next value
    const next = this._value[index + 1];
    // remove next state
    this._value = this._value.slice(0, index + 1);
    // get cached state
    const result = last(this._value);
    // merge `activePath`
    return {
      activePath: next && next.path,
      ...result
    }
  },

  clear() {
    this._value.length = 0;
  },

  /**
   * 
   * @param {*} dirId current repo id
   * @param {*} path current path
   * @param {*} kw keyword
   * @param {*} ver version
   */
  find(dirId, path = '', kw, ver) {
    const index = this._value
      .map(item => item.path)
      .lastIndexOf(path);

    if (index === -1) return -1;
    const target = this._value[index];

    if (
      target._dirId === dirId 
      && target._kw === kw 
      && target._ver === ver
    ) {
      return index;
    } else {
      return -1
    }
  }
};

const initialState = {
  inited: false,
  name: '',
  path: '',

  type: '',
  fileType: '',

  cover: '',
  banner: '',
  placeholder: 1,
  width: undefined,
  height: undefined,
  
  birthtime: '',
  metadata: null,
  shortId: false,

  // children
  list: [], // <-- all children
  files: [], // Manga[]
  mangas: [], // Manga[]
  chapters: [], // Manga[]
  chaptersSp: [], // Manga[]
  images: [], // Manga[]

  versions: [], // Manga[]
  verNames: null, // String[]
  
  // active item TODO: need optimize and pretty
  activePath: '', // acitve path of `state.list`
  activeVer: '', // active ver of `state.versions`
  activeVerPath: '', // active path of `state.versions`

  ...statusHelper.state()
};

let abortController = null;

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

    empty(state) {
      return state.inited && state.path !== consts.LATEST_PATH && !state.list.length;
    },

    mangas(state, getters, allState) {
      let mangas = null;
      if (state.path === consts.LATEST_PATH) {
        mangas = allState.explorer.latest;
      } else {
        mangas = state.mangas;
      }

      // reflow mangas to fit gutter
      reflowMangas(mangas, allState.app.size);
      return mangas;
    }
  },

  actions: {
    [FETCH_MANGAS]({ commit, getters }, payload = {}) {
      // cancel it if prev fetch is not done
      if (getters.pending && abortController) {
        abortController.abort();
        abortController = null; // clear prev abort controller
      }

      let index = -1;
      const { dirId, path, isBack, search, keyword, clear, ver, uptime } = payload;
      if (isBack) index = cacheStack.find(dirId, path, keyword, ver, uptime);

      // hack no flashing when random manga
      statusHelper.pending(commit);

      // TODO: lose back active path
      if (path === consts.LATEST_PATH) {
        commit(SET_MANGAS, { 
          ...initialState,
          name: 'Latest',
          path,
        });
        return statusHelper.success(commit);
      }
 
      // if cannot find cache or clear cache
      if (index === -1 || clear) {
        const params = { dirId, path };
        const options = {};
        const method = search ? 'search' : 'list';
      
        abortController = new AbortController();
        options.signal = abortController.signal;
        
        if (search) {
          params.keyword = keyword;
          params.ver = ver;
          params.uptime = uptime;
        }

        if (clear) {
          params._t = +new Date;
        }

        return mangaAPI[method](params, options)
          .then(res => {
            // cache current state
            Object.assign(res, {
              _dirId: dirId,
              _kw: keyword,
              _ver: ver
            });
            
            cacheStack[clear ? 'replace' : 'push'](res);
            abortController = null;
            commit(SET_MANGAS, res);
            return statusHelper.success(commit);
          })
          .catch(error => {
            // skip abort error
            if (error.name !== 'AbortError') {
              abortController = null; 
              statusHelper.error(commit, error);
            }
          });

      // get result from cache
      } else {
        const result = cacheStack.pop(index);
        commit(SET_MANGAS, result);
        return statusHelper.success(commit);
      }
    },

    [FETCH_VERSION]({ commit, state }, payload = {}) {
      const { activeVer, versions } = state;
      const { dirId, ver } = payload;
      
      if (activeVer === ver) return;

      const currVer = find(versions, { ver });

      // check version has been loaded
      if (currVer && currVer.inited) {
        commit(SET_VERSION, { ver, res: currVer });
      } else {
        const { path } = currVer;
        // get version data first
        mangaAPI.list({ dirId, path })
          .then(res => {
            commit(ADD_VERSION, { ver, res });
            commit(SET_VERSION, { ver, res }) 
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
    [SET_MANGAS](state, payload) {
      state.inited || (state.inited = true);
      safeAssign(state, {
        activeVer: '',
        cover: '',
        banner: '',
        placeholder: 1,
        width: '', // TODO: remove safeAssign
        height: '', // TODO:
        fileType: '',
        error: null,
        shortId: false,
        metadata: null // fixed when list no-metadata cannot overwrite prev metadata
      }, payload);
    },

    // TODO:
    [ADD_VERSION](state, payload) {
      const { ver, res } = payload;
      const version = find(state.versions, { ver });
      safeAssign(version, { ...res, inited: true }); // add version data
    },

    [SET_VERSION](state, payload) {
      const { ver, res } = payload;
      // also change parent path
      const obj = pick(res, ['list', 'files', 'mangas', 'chapters', 'images']);

      // use version date replace current data
      state.activeVer = ver;
      state.activeVerPath = res.path;
      state.fileType = res.fileType || '';
      safeAssign(state, obj);
    },

    [SHARE](state, payload) {
      const { shortId } = payload;
      safeAssign(state, { shortId });
    },

    ...statusHelper.mutation()
  }
});

export default createModule;

function reflowMangas(mangas, size) {
  const lineCount = consts.MANGA_GRID_SIZE[size];

  let i = 0, count = 0, l = mangas.length, j;
  while (i < l) {
    let p = mangas[i].placeholder;
    if (lineCount == 3 && p == 2) p = 3;
    count += p;

    // handle filled line
    if (count === lineCount) {
      // reset count
      count = 0;
      i++;
    
    // handle not fill
    } else if (count < lineCount) {
      i++;
    
    // handle count exceed
    } else if (count > lineCount) {
      let need = lineCount - (count - p);
      j = i+1;  

      // find first suitable manga size
      while (j < l && need > 0) {
        let q = mangas[j].placeholder;
        if (lineCount == 3 && q == 2) q = 3;
        
        if (q <= need) {
          mangas.splice(i, 0, mangas[j]);
          mangas.splice(j+1, 1);
          need -= q;
          i++;
        }

        j++;
      }
      count = 0;
    }
  }
}