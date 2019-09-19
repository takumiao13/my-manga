import Vue from 'vue';
//import smoothscroll from './smooth-scroll';

export * from 'shared';


const inElectron = / (?:e|E)lectron\//.test(navigator.userAgent);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const eventHub = new Vue();

const byId = document.getElementById.bind(document);

const getScrollTop = (elem) => {
  return elem ? elem.scrollTop : 
        window.pageYOffset || 
        document.documentElement.scrollTop || 
        document.body.scrollTop;
}

const getScrollHeight = (elem) => {
  return elem ? elem.scrollHeight : Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );
}

const getOffsetHeight = (elem) => {
  return elem ? elem.clientHeight : window.innerHeight;
}

export { 
  inElectron, 
  byId, 
  getScrollTop,
  getScrollHeight,
  getOffsetHeight,
  delay, 
  eventHub,
  //smoothscroll
}