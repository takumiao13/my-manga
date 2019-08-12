const rePropName = /[^.\[\]]+/g;

/**
 * Converts `string` to a property path array.
 *
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
exports.stringToPath = (string) => {
  var result = [];
  string.replace(rePropName, function(match, number) {
    result.push(match);
  });
  return result;
}


exports.regexIndexOf = (string, re, i = 0) => {
  const indexInSuffix = string.slice(i).search(re);
  return indexInSuffix < 0 ? indexInSuffix : indexInSuffix + i;
}



function decode(str) {
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  } catch (err) {
    return str;
  }
}

function parseValue(url) {
  var search;
  if (url === void 0) {
    search = window.location.search.substr(1).split('&');
  } else {
    var regex = /[?&]([^&#=]+)=?([^&#]*)/g;
    var result = null;
    search = [];
    while (result = regex.exec(url)) {
      search.push(result[1] + '=' + result[2]);
    }
  }
  return search;
}

exports.qs = (url) => {
  var params = {};
  var search = parseValue(url);
  if (search == '') return params;
  for (var i=0, l=search.length; i<l; i++) {
    var pair = search[i].split('=');
    if (pair.length == 1) {
      params[decode(pair[0])] = '';
    } else {
      params[decode(pair[0])] = decode(pair[1]);
    }
  }
  return params;
}
