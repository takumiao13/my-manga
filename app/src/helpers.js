import Vue from 'vue';

export * from 'shared';

const inElectron = / (?:e|E)lectron\//.test(navigator.userAgent);

const byId = document.getElementById.bind(document);

const delay = (ms) => new Promise((resolve, reject) => {
  setTimeout(() => { resolve() }, ms);
});

const eventHub = new Vue();

export { inElectron, byId, delay, eventHub }