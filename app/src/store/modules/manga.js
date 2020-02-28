import { safeAssign, last, find, pick } from '@/helpers/utils';
import { createTypesWithNamespace, createRequestStatus } from '../helpers';
import mangaAPI from '@/apis/manga';
import consts from '@/consts';

// Namespace
export const NAMESPACE = 'manga';

// Types Enum
const FETCH = 'FETCH';
const TOGGLE_VERSION = 'TOGGLE_VERSION';
const SHARE = 'SHARE';

const statusHelper = createRequestStatus('status');

export const types = createTypesWithNamespace([ FETCH, SHARE, TOGGLE_VERSION ], NAMESPACE);

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
    activePath: '',
    shortId: false,
    list: [], // <-- all children
    files: [], 
    mangas: [],
    chapters: [],
    versions: [],
    images: [],
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
        commit(FETCH, result);
        return statusHelper.success(commit);
      }
    },

    [TOGGLE_VERSION]({ commit, state }, payload = {}) {
      const { dirId, ver } = payload;
      // FIXED: when not found path ??
      const currentVersion = find(state.versions, { versionName: ver });
      const { inited, path } = currentVersion;


      // TODO: pretty code
      if (inited) {
        commit(TOGGLE_VERSION, { ver, res: currentVersion });
      } else {
        mangaAPI.list({ dirId, path })
          .then(res => {
            commit(TOGGLE_VERSION, { ver, res });
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
        error: null,
        shortId: false
      });
    },

    [TOGGLE_VERSION](state, payload) {
      const { ver, res } = payload;
      const version = find(state.versions, {
        versionName: ver
      });

      const obj = pick(res, ['list', 'files', 'mangas', 'chapters', 'images']);
      safeAssign(version, { ...res, inited: true });
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

function reflowMangas(mangas, size) {
  const lineCount = consts.MANGA_GRID_SIZE[size];

  let i = 0, count = 0, l = mangas.length, j;
  while (i < l) {
    let p = mangas[i].placeholder;
    if (lineCount == 3 && p == 2) p = 3;
    count += p;

    if (count === lineCount) {
      count = 0;
      i++;
    } else if (count < lineCount) {
      i++;
    
    // handle count exceed
    } else if (count > lineCount) {
      let need = lineCount - (count - p);
      j = i+1;  
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