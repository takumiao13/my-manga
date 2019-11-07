import VueRouter from 'vue-router';

// sync history to rotuer
const RH = '_RH';
const SHL = '_SHL';
const sess = window.sessionStorage;

export default class AppRouter extends VueRouter {

  _backdelta;

  _routerHistory = JSON.parse(sess.getItem(RH) || '[]');

  _startHistoryLength = +sess.getItem(SHL) || window.history.length;

  constructor(...args) {
    window.onbeforeunload = () => {
      // store history when refresh
      sess.setItem(RH, JSON.stringify(this._routerHistory));
      sess.setItem(SHL, this._startHistoryLength);
    }

    super(...args);
  }

  navigate(to) {
    const route = this.match(to);
    const index = this._routerHistory.lastIndexOf(historyName(route));
  
    if (index > -1) {
      this._backdelta = this._routerHistory.length - index;
      this.go(-this._backdelta);
    } else {
      this.push(to);
    }
  }

  push(...args) {
    this._push = true;
    const promise = super.push(...args);	
    if (promise) return promise.catch(err => err);
  }

  replace(...args) {
    this._replace = true;
    return super.replace(...args);
  }

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

  canGoBack() {
    return this._routerHistory.length > 1;
  }
}

export function historyName(route) {
	return decodeURIComponent(route.fullPath);
}