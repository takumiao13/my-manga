function decode(str) {
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  } catch (err) {
    return str;
  }
}

function encode(str) {
  return encodeURIComponent(str);
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

export const parse = (url) => {
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

export default {
  parse,
  encode,
  decode
}