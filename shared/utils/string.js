const crypto = require('crypto');

const rePropName = /[^.\[\]]+/g;

/**
 * Converts `string` to a property path array.
 *
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
const stringToPath = (string) => {
  var result = [];
  string.replace(rePropName, function(match, number) {
    result.push(match);
  });
  return result;
}

const regexIndexOf = (string, re, i = 0) => {
  const indexInSuffix = string.slice(i).search(re);
  return indexInSuffix < 0 ? indexInSuffix : indexInSuffix + i;
}

const randomStr = (howMany, chars) => {
  chars = chars || 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789_-';
  const rnd = crypto.randomBytes(howMany),
    value = new Array(howMany),
    len = Math.min(256, chars.length),
    d = 256 / len;

  for (let i = 0; i < howMany; i++) {
    value[i] = chars[Math.floor(rnd[i] / d)];
  }

  return value.join('');
}

module.exports = {
  stringToPath,
  regexIndexOf,
  randomStr
}