import VueRouter from 'vue-router';
import { get, isArray } from '@/helpers/utils';

// sync history to rotuer
const RH = '_RH';
const SHL = '_SHL';
const sess = window.sessionStorage;

export default class AppRouter extends VueRouter {

  _backdelta;

  _routerHistory = JSON.parse(sess.getItem(RH) || '[]');

  _startHistoryLength = +sess.getItem(SHL) || window.history.length;

  _middleware = [];

  constructor(...args) {
    window.onbeforeunload = () => {
      // store history when refresh
      sess.setItem(RH, JSON.stringify(this._routerHistory));
      sess.setItem(SHL, this._startHistoryLength);
    }

    super(...args);
  }

  /**
   * 
   * @param {*} location 
   */
  navigate(location, onComplete, onAbort) {
    const route = this.match(location);
    const index = this._routerHistory.lastIndexOf(historyName(route));
  
    if (index > -1) {
      this._backdelta = this._routerHistory.length - index;
      this.go(-this._backdelta);
    } else {
      this.push(location, onComplete, onAbort);
    }
  }

  /**
   * 
   * @override
   * @param {*} location 
   * @param {*} onComplete 
   * @param {*} onAbort 
   */
  push(location, onComplete, onAbort) {
    this._push = true;
    location = this._attachActivityQuery(location);
    const promise = super.push(location, onComplete, onAbort);
    if (promise) return promise.catch(err => err);
  }

  /**
   * 
   * @override
   * @param {*} location 
   * @param {*} onComplete 
   * @param {*} onAbort 
   */
  replace(location, onComplete, onAbort) {
    this._replace = true;
    location = this._attachActivityQuery(location);
    const promise = super.replace(location, onComplete, onAbort);
    if (promise) return promise.catch(err => err);
  }

  _attachActivityQuery(location) {
    const activity = get(location, 'query.activity');
    
    // Add global activity to location
    if (!activity) {
      location.query || (location.query = {});
      Object.assign(location.query, { 
        activity: this.app.$store.state.app.activity
      })
    }

    return location;
  }

  /**
   * Pop history to root.
   * 
   * @param {function} done
   * @returns {void}
   */
  popToRoot(done) {
    const delta = -window.history.length + this._startHistoryLength;
    
    if (this.canGoBack()) {
      // backward all history (we cannot clear it)
      this._reset = true;
      this._routerHistory = ['/'];
  
      window.history.go(delta);
      setTimeout(done, 260);
    } else {
      done();
    }
  }

  /**
   * History is can go back.
   * @returns {boolean}
   */
  canGoBack() {
    return this._routerHistory.length > 1;
  }

  /**
   * Use the given middleware `fn`.
   *
   * @param {Function} fn
   * @return {AppRouter}
   */
  use(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('router mw must be a function!');
    }

    this._middleware.push(fn);
    return this;
  }

  /**
   * Handle route before enter.
   * 
   * @param {Location} to 
   * @param {Location} from 
   * @param {function} next 
   */
  handleBeforeEnter(to, from) {
    const fnMiddleware = this._compose(this._middleware);
    const context = { router: this, to, from};
    return fnMiddleware(context);
  }

  /**
   * Compose `middleware` returning
   * a fully valid middleware comprised
   * of all those which are passed.
   *
   * @param {Array} middleware
   * @return {Function}
   */

  _compose (middleware) {
    // check middleware first.
    if (!isArray(middleware)) {
      throw new TypeError('Middleware stack must be an array!')
    }

    for (const fn of middleware) {
      if (typeof fn !== 'function') {
        throw new TypeError('Middleware must be composed of functions!');
      }
    }

    /**
     * @param {Object} context
     * @return {Promise}
     */
    return function (context, next) {
      // last called middleware #
      let index = -1;
      return dispatch(0);
      function dispatch (i) {
        if (i <= index) return Promise.reject(new Error('next() called multiple times'));
        index = i;
        let fn = middleware[i];
        if (i === middleware.length) fn = next;
        if (!fn) return Promise.resolve();
        try {
          return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
        } catch (err) {
          return Promise.reject(err);
        }
      }
    }
  }
}

// remove activity queryparams
// ?[activity=1] -> ''
// ?[activity=2&]foo-3 -> /foo=3
// ?foo=3&[activity=4&]bar=4 -> ?foo=3&bar=4
export function historyName(route) {
  const name = route.fullPath
    .replace(/%2525/g, '%25') // handle `%` bug
    .replace(/activity=([^&#]*)&?/, '')
    .replace(/\?$/, '');

  return name;
}