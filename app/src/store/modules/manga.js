import { safeAssign, last, find, pick } from '@/helpers/utils';
import { createTypesWithNamespace, createRequestStatus } from '../helpers';
import mangaAPI from '@/apis/manga';
import consts from '@/consts';

// Namespace
export const NAMESPACE = 'manga';

// Types Enum
const FETCH = 'FETCH';
const FETCH_VERSION = 'FETCH_VERSION';
const FETCH_MANGAS = 'fetchMangas';
const SHARE = 'SHARE';

const ADD_VERSION = 'ADD_VERSION';
const SET_VERSION = 'setVersion';

const statusHelper = createRequestStatus('status');

export const types = createTypesWithNamespace([ 
  FETCH, SHARE,
  FETCH_VERSION 
], NAMESPACE);

export const cacheStack = {
  _value: [],

  push(item) {
    this._value.push(item);
    //console.log('--->', item, this._value);
  },

  replace(item) {
    const index = this.find(item._dirId, item.path, item._kw);
    if (~index) {
      this._value[index] = item;
    } else {
      this.push(item);
    }
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

  /**
   * 
   * @param {*} dirId current repo id
   * @param {*} path current path
   * @param {*} kw keyword
   */
  find(dirId, path = '', kw, ver) {
    const index = this._value
      .map(item => item.path)
      .lastIndexOf(path);

    //console.log('--->', index, dirId, kw);
    if (~index) {
      const target = this._value[index];
      if (target._dirId === dirId && target._kw === kw && target._ver === ver) {
        return index;
      } else {
        return -1
      }
    } else {
      return -1;
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
  
  birthtime: '',
  metadata: null,
  shortId: false,

  // children
  list: [], // <-- all children
  files: [], // Manga[]
  mangas: [], // Manga[]
  chapters: [], // Manga[]
  images: [], // Manga[]

  versions: [], // Manga[]
  verNames: null, // String[]
  
  // active item TODO: need optimize and pretty
  activePath: '', // acitve path of `state.list`
  activeVer: '', // active ver of `state.versions`
  activeVerPath: '', // active path of `state.versions`

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
    [FETCH]({ commit }, payload = {}) {
      let index = -1;
      const { dirId, path, isBack, search, keyword, clear, ver, uptime } = payload;
      if (isBack) index = cacheStack.find(dirId, path, keyword, ver, uptime);
      // console.log(isBack, index, path);
      // hack no flashing when random manga
      statusHelper.pending(commit);

      if (path === consts.LATEST_PATH) {
        commit(FETCH, { 
          ...initialState,
          name: 'Latest',
          path,
        });
        return statusHelper.success(commit);
      }
      
      // if cannot find cache or clear cache
      if (index === -1 || clear) {
        const method = search ? 'search' : 'list';
        const params = { dirId, path };
        
        if (search) {
          params.keyword = keyword;
          params.ver = ver;
          params.uptime = uptime;
        }

        if (clear) {
          params._t = +new Date;
        }

        return mangaAPI[method](params)
          .then(res => {
            cacheStack[!clear ? 'push' : 'replace'](Object.assign(res, {
              _prevPath: path, // store the prev path
              _dirId: dirId,
              _kw: keyword,
              _ver: ver
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
        commit(FETCH, result);
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
    [FETCH](state, payload) {
      state.inited || (state.inited = true);
      safeAssign(state, {
        activeVer: '',
        cover: '',
        banner: '',
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