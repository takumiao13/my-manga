
function encode(str) {
  if (!str) return str;
  return encodeURI(str);
}

function decode(str) {
  if (!str) return str;

  try {
    // will cause filename with `+` error
    // str.replace(/\+/g, ' ')
    return decodeURI(str);
  } catch (err) {
    return str;
  }
}

function parseValue(url) {
  var search;
  if (url === void 0) {
    search = window.location.search.substr(1).split('&');
  } else {
    search = [];
    var regex = /[?&]([^&#=]+)=?([^&#]*)/g;
    var result;
    while (result = regex.exec(url)) {
      search.push(result[1] + '=' + result[2]);
    }
  }
  return search;
}

export const parse = (url) => {
  var params = {};
  var search = parseValue(url);
  if (search == '') return params;
  for (var i=0, l=search.length; i<l; i++) {
    var pair = search[i].split('=');
    if (pair.length == 1) {
      params[decodeURIComponent(pair[0])] = '';
    } else {
      params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
  }
  return params;
}

export default {
  parse,
  encode,
  decode
}