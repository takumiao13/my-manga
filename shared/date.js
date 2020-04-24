const pattern = /yy(?:yy)?|m{2}|d{2}|H{2}|M{2}|s{2}/g;
const defaultPattern = 'yyyy-mm-dd HH:MM:ss';
const pad = function(val) {
  return ('0' + val).slice(-2);
};

const format = (date, input) => {
  data = date ? new Date(date) : new Date;
  if (isNaN(date)) throw SyntaxError("invalid date");
  
  input = input ? '' + input : defaultPattern;

  var y = date.getFullYear(),
      m = date.getMonth(),
      d = date.getDate(),
      H = date.getHours(),
      M = date.getMinutes(),
      s = date.getSeconds();

  var formatter = {
    yyyy: y,
    yy: ('' + y).slice(-2),
    mm: pad(m+1),
    dd: pad(d),
    HH: pad(H),
    MM: pad(M),
    ss: pad(s)
  };

  return input.replace(pattern, function(token) {
    return formatter[token];
  });
}

module.exports = {
  format
}