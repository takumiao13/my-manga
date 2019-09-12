import Vue from 'vue';

export * from 'shared';

const inElectron = / (?:e|E)lectron\//.test(navigator.userAgent);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const eventHub = new Vue();

const byId = document.getElementById.bind(document);

const getScrollTop = () => {
  return window.pageYOffset || 
        document.documentElement.scrollTop || 
        document.body.scrollTop;
}

const getScrollHeight = () => {
  return Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );
}

const getOffsetHeight = () => {
  return window.innerHeight;
}

export { 
  inElectron, 
  byId, 
  getScrollTop,
  getScrollHeight,
  getOffsetHeight,
  delay, 
  eventHub 
}