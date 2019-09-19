import { assign } from '@/helpers';

export function createTypesWithNs(types, ns) {
  const obj = {};

  types.forEach(type => {
    obj[type] = `${ns}/${type}`
  });

  return obj;
}

export function createRequestStatus(name, type = 'STATUS') {
  const PENDING = 'pending';
  const SUCCESS = 'success';
  const ERROR = 'error';
  const WARN = 'warn';
  const PENDING_DEBOUNCED = 'pending_debounced';
  const SUCCESS_DEBOUNCED = 'success_debounced';
  
  let timer = null;

  function clear() {
    clearTimeout(timer);
    timer = null;
  }
  
  return {
    state() {
      return {
        [name]: PENDING,
        error: null
      }
    },

    pending(commit) {
      commit(type, { [name]: PENDING })
      timer = setTimeout(() => {
        commit(type, { [name]: PENDING_DEBOUNCED });
        timer = null;
      }, 200);
    },

    success(commit) {
      // has received response from server
      if (timer === null) {
        // loading has shown
        return new Promise((resolve) => {
          commit(type, { [name]: SUCCESS })
          setTimeout(() => {
            commit(type, { [name]: SUCCESS_DEBOUNCED });
            resolve();
          }, 360); // after 360ms hide loading
        })
      }
      
      // loading hasn't shown
      clear();
      return new Promise((resolve) => {
        commit(type, { [name]: SUCCESS_DEBOUNCED });
        resolve();
      });
      
    },

    error(commit, payload = {}) {
      clear();
      const isWarn = payload.warn;
      commit(type, { 
        [name]: isWarn ? WARN : ERROR,
        error: payload
      });
      throw payload;
    },

    mutation() {
      return {
        [type](state, payload = {}) {
          assign(state, payload);
        }
      }
    },

    is: {
      pending(state) {
        return state[name] === PENDING_DEBOUNCED;
      },

      success(state, immediately) {
        if (immediately) {
          return state[name] === SUCCESS_DEBOUNCED;
        } else {
          return state[name] === SUCCESS_DEBOUNCED || state[name] === PENDING;
        }
      },

      error(state) {
        return state[name] === ERROR;
      },

      warn(state) {
        return state[name] === WARN;
      }
    }
  }
}