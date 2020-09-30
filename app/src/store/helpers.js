import { safeAssign } from '@/helpers/utils';

export function createTypesWithNamespace(types, namespace) {
  const obj = {};

  types.forEach(type => {
    obj[type] = `${namespace}/${type}`
  });

  return obj;
}

export function createRequestStatus(name, type = 'STATUS') {
  const PENDING = 'pending';
  const SUCCESS = 'success';
  const ERROR = 'error';
  const WARN = 'warn';
  
  return {
    state() {
      return {
        [name]: PENDING,
        error: null
      }
    },

    pending(commit) {
      commit(type, { [name]: PENDING });
    },

    success(commit) {
      commit(type, { [name]: SUCCESS });
    },

    error(commit, payload = {}) {
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
          safeAssign(state, payload);
        }
      }
    },

    is: {
      pending(state) {
        return state[name] === PENDING;
      },

      success(state) {
        return state[name] === SUCCESS;
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