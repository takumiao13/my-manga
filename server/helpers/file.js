const fs = require('fs-extra');
const pathFn = require('path');

exports.extname = (file) => pathFn.extname(file).substr(1);

exports.pathExists = (path) => 
  new Promise(resolve => fs.access(path, fs.F_OK, err => resolve(!err)));

exports.pathAccess = (path) => {
  try {
    fs.accessSync(path)
    return true;
  } catch(e) {
    return false;
  }
}

exports.filenameComparator = (a, b) => {
  // first check a or b whether contains other.
  if (a.indexOf(b) === 0 && b.indexOf(a) === -1) return 1;
  if (b.indexOf(a) === 0 && a.indexOf(b) === -1) return -1;

  let m = 0, n = 0;
  const j = a.length, k = b.length;

  while (m < j && n < k) {
    let ca = a.substr(m++),
        cb = b.substr(n++);

    let na = parseInt(ca, 10),
        nb = parseInt(cb, 10);

    // case for `xx-1` > `xx-2` 
    // will check negative number `-1` and `-2`
    ca = (!isNaN(na) && na >= 0) ? na : ca[0];
    cb = (!isNaN(nb) && nb >= 0) ? nb : cb[0];  

    const aIsNum = typeof ca === 'number';
    const bIsNum = typeof cb === 'number';

    if (ca === cb) continue;

    if (aIsNum && bIsNum) {
      return ca - cb;
    } else if (!aIsNum && !bIsNum) {
      return [-1, 1][+(ca > cb)];
    } else {
      if (!aIsNum) return '.-_'.indexOf(ca) > -1 ? -1 : 1;
      if (!bIsNum) return '.-_'.indexOf(cb) > -1 ? 1 : -1;
    }
  }
};