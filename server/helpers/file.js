const fs = require('fs-extra');
const pathFn = require('path');
const { isRegExp, isNumber } = require('../../shared');

exports.extname = (file) => pathFn.extname(file).substr(1);

exports.pathExists = (path) => 
  new Promise(resolve => fs.access(path, fs.F_OK, err => resolve(!err)));

exports.sortFiles = (files) => files.sort((a, b) => {
  var m = 0, n = 0;
  var j = a.length, k = b.length;

  while (m < j && n < k) {
    let ca = a.substr(m++),
        cb = b.substr(n++);

    let na = parseInt(ca, 10),
        nb = parseInt(cb, 10);

    // case for xx-1 > xx-2 will check -1 and -2
    ca = (!isNaN(na) && na > 0) ? na : ca[0];
    cb = (!isNaN(nb) && na > 0) ? nb : cb[0];  

    const isANum = isNumber(ca);
    const isBNum = isNumber(cb);

    if (ca === cb) continue;

    if (isANum && isBNum) {
      return ca - cb;
    } else if (!isANum && !isBNum) {
      return [-1, 1][+(ca > cb)];
    } else {
      if (!isANum) return 1;
      if (!isBNum) return -1;
    }
  }
});