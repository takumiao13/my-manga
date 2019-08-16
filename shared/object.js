const _set = require('lodash/set');
const _get = require('lodash/get');
const _unset = require('lodash/unset');
const _has = require('lodash/has');
const _cloneDeep = require('lodash/cloneDeep');
const { isArray } = require('./type');
const { stringToPath } = require('./string');

// ignore undefined properties
exports.assign = (target, ...sources) =>
  Object.assign(target, ...sources.map(x =>
    Object.entries(x)
      .filter(([key, value]) => value !== undefined)
      .reduce((obj, [key, value]) => (obj[key] = value, obj), {})
  ))

exports.set = _set;

exports.get = _get;

exports.has = _has;

exports.unset = (obj, key) => {
  const path = stringToPath(key);
  
  if (_unset(obj, key)) {
    const key = path.slice(0, -1);
    const v = _get(obj, key);
    if (isArray(v)) {
      _set(obj, key, v.filter(item => item !== void 0))
    }
  }
  
  return obj;
}

exports.cloneDeep = _cloneDeep;