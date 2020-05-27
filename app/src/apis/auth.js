import fetch from './fetch';

function login(body) {
  return fetch('api/login', {
    method: 'post',
    headers: {
      'content-type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify(body)
  });
}

function check() {
  return fetch('api/auth/check', {
    cache: 'no-cache'
  });
}

export default {
  login,
  check
}