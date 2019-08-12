import fetch from './fetch';

function get({ path } = {}) {
  let url = `api/conf`;
  if (path) url += `/${encodeURIComponent(path)}`;
  
  return fetch(url);
}

export default {
  get
}