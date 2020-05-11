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
  find(dirId, path = '', kw) {
    const index = this._value
      .map(item => item.path)
      .lastIndexOf(path);

    //console.log('--->', index, dirId, kw);
    if (~index) {
      const target = this._value[index];
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

const initialState = {
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

  // TODO: need optimize and pretty
  activePath: '', // acitve path of `state.list`
  activeVer: '', // active ver of `state.versions`
  activeVerPath: '', // active path of `state.versions`
  shortId: false,

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
      const { dirId, path, isBack, search, keyword, clear } = payload;
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
          activeVerPath: '',
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
      
      // if cannot find cache or clear cache
      if (index === -1 || clear) {
        const method = search ? 'search' : 'list';
        const params = { dirId, path };
        
        if (search) {
          params.keyword = keyword;
        }

        if (clear) {
          params._t = +new Date;
        }

        return mangaAPI[method](params)
          .then(res => {
            cacheStack[!clear ? 'push' : 'replace'](Object.assign(res, {
              _prevPath: path, // store the prev path
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
        commit(FETCH, result);
        return statusHelper.success(commit);
      }
    },

    [TOGGLE_VERSION]({ commit, state }, payload = {}) {
      const { activeVer, versions } = state;
      const { dirId, ver } = payload;
      
      if (activeVer === ver) return;

      const currVer = find(versions, { ver });

      // check version has loaded
      if (currVer && currVer.inited) {
        commit(TOGGLE_VERSION, { ver, res: currVer });
      } else {
        const { path } = currVer;
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
        activeVer: '',
        error: null,
        shortId: false,
        metadata: null // fixed when list no-metadata cannot overwrite prev metadata
      }, payload);
    },

    [ADD_VERSION](state, payload) {
      const { ver, res } = payload;
      const version = find(state.versions, { ver });
      safeAssign(version, { ...res, inited: true }); // add version data
    },

    [TOGGLE_VERSION](state, payload) {
      const { ver, res } = payload;
      // also change parent path
      const obj = pick(res, ['list', 'files', 'mangas', 'chapters', 'images']);

      // use version date replace current data
      state.activeVer = ver;
      state.activeVerPath = res.path;
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