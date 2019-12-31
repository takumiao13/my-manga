
const { stringToPath } = require('./string');
const { set, get, isArray, unset: _unset } = require('lodash');

// ignore undefined properties
const safeAssign = (target, ...sources) =>
  Object.assign(target, ...sources.map(x =>
    Object.entries(x)
      .filter(([key, value]) => value !== undefined)
      .reduce((obj, [key, value]) => (obj[key] = value, obj), {})
  ))

const unset = (obj, key) => {
  const path = stringToPath(key);
  
  if (_unset(obj, key)) {
    const key = path.slice(0, -1);
    const v = get(obj, key);
    if (isArray(v)) {
      set(obj, key, v.filter(item => item !== void 0))
    }
  }
  
  return obj;
}

module.exports = {
  safeAssign,
  unset
}