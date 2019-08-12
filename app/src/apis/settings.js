import fetch from './fetch';

function get({ key, scope }) {
  let url = `api/settings?scope=${scope}`;
  if (key) url += `&key=${key}`;
  return fetch(url);
}

function post({ key, value, scope }) {
  return fetch('api/settings', {
    method: 'post',
    headers: {
      'content-type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify({ key, value, scope })
  });
}

export default {
  get,
  post
}