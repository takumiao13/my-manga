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

module.exports = {
  stringToPath,
  regexIndexOf
}